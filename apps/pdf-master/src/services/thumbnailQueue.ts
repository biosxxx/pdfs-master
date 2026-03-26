import { ErrorCode, PdfMasterError } from '@/domain/errors';
import type { PdfReader } from '@/domain/types';
import type { RenderWorkerMessage, RenderWorkerRequest, RenderWorkerResponse } from '@/workers/protocols';
import { createId } from '@/utils/ids';
import { LruMap } from '@/utils/lru';
import { makeObjectUrl, revokeObjectUrl } from '@/utils/objectUrl';
import { PromiseQueue } from '@/utils/promiseQueue';
import { getThumbnailRenderEnvironment } from '@/utils/thumbnailRendering';

interface ThumbnailRequest {
  pageId: string;
  documentId: string;
  sourceFile: File;
  pageIndex: number;
  maxWidth: number;
}

interface RenderWorkerClient {
  id: number;
  worker: Worker;
  busy: boolean;
  terminated: boolean;
  handleMessage: (event: MessageEvent<RenderWorkerResponse>) => void;
  handleError: (event: ErrorEvent) => void;
}

const WORKER_RENDER_TIMEOUT_MS = 4000;

export class ThumbnailQueue {
  private readonly queue: PromiseQueue<string>;
  private readonly cache = new LruMap<string, string>(180, (_key, url) => revokeObjectUrl(url));
  private readonly pending = new Map<
    string,
    {
      promise: Promise<string>;
      controller: AbortController;
      documentId: string;
      workerRequestId?: string;
    }
  >();
  private readonly renderWorkers: RenderWorkerClient[] = [];
  private readonly workerRequests = new Map<
    string,
    {
      resolve: (blob: Blob) => void;
      reject: (error: unknown) => void;
      client: RenderWorkerClient;
    }
  >();
  private readonly fallbackConcurrency: number;
  private workerAvailable = false;

  constructor(private readonly reader: PdfReader) {
    const renderEnvironment = getThumbnailRenderEnvironment();
    this.fallbackConcurrency = renderEnvironment.fallbackConcurrency;
    this.queue = new PromiseQueue<string>(renderEnvironment.maxParallelRenders);

    for (let index = 0; index < renderEnvironment.workerPoolSize; index += 1) {
      this.renderWorkers.push(this.createRenderWorker(index));
    }

    this.syncQueueConcurrency();
  }

  requestThumbnail(request: ThumbnailRequest): Promise<string> {
    const cached = this.cache.get(request.pageId);
    if (cached) {
      return Promise.resolve(cached);
    }

    const existing = this.pending.get(request.pageId);
    if (existing) {
      return existing.promise;
    }

    const controller = new AbortController();
    const workerRequestId = createId('render');
    const promise = this.queue
      .add(async () => {
        const blob = await this.renderThumbnail(request, controller, workerRequestId);
        const url = makeObjectUrl(blob);
        this.cache.set(request.pageId, url);
        return url;
      })
      .finally(() => {
        this.pending.delete(request.pageId);
      });

    this.pending.set(request.pageId, {
      promise,
      controller,
      documentId: request.documentId,
      workerRequestId,
    });
    return promise;
  }

  cancelPage(pageId: string): void {
    const pending = this.pending.get(pageId);
    if (pending) {
      pending.controller.abort();
      this.pending.delete(pageId);
    }
    this.cache.delete(pageId);
  }

  cancelDocument(documentId: string): void {
    for (const [pageId, pending] of this.pending.entries()) {
      if (pending.documentId !== documentId) {
        continue;
      }
      pending.controller.abort();
      this.pending.delete(pageId);
    }
    this.broadcastToWorkers({ type: 'render:release-document', documentId });
    void this.reader.destroy(documentId);
  }

  clear(): void {
    for (const [pageId, pending] of this.pending.entries()) {
      pending.controller.abort();
      this.pending.delete(pageId);
    }
    this.broadcastToWorkers({ type: 'render:reset' });
    this.cache.clear();
  }

  dispose(): void {
    this.clear();
    for (const client of this.getActiveWorkers()) {
      client.worker.removeEventListener('message', client.handleMessage);
      client.worker.removeEventListener('error', client.handleError);
      client.worker.terminate();
      client.busy = false;
      client.terminated = true;
    }
    this.syncQueueConcurrency();
  }

  private async renderThumbnail(
    request: ThumbnailRequest,
    controller: AbortController,
    workerRequestId: string,
  ): Promise<Blob> {
    if (controller.signal.aborted) {
      throw new DOMException('Thumbnail rendering canceled.', 'AbortError');
    }

    if (this.workerAvailable && this.getActiveWorkers().length) {
      try {
        return await this.renderViaWorker(request, controller, workerRequestId);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        if (
          error instanceof PdfMasterError &&
          (error.code === ErrorCode.UnsupportedOperation || error.code === ErrorCode.WorkerFailed)
        ) {
          this.disableRenderWorkers(error);
        } else if (error instanceof Error && error.message.includes('OffscreenCanvas')) {
          this.disableRenderWorkers(
            new PdfMasterError(ErrorCode.UnsupportedOperation, 'OffscreenCanvas is not available for render workers.'),
          );
        }
      }
    }

    return this.reader.renderPageThumbnail({
      documentId: request.documentId,
      sourceFile: request.sourceFile,
      pageIndex: request.pageIndex,
      maxWidth: request.maxWidth,
      signal: controller.signal,
    });
  }

  private renderViaWorker(
    request: ThumbnailRequest,
    controller: AbortController,
    workerRequestId: string,
  ): Promise<Blob> {
    const client = this.acquireWorker();
    if (!client) {
      return Promise.reject(
        new PdfMasterError(ErrorCode.WorkerFailed, 'No render worker is currently available for thumbnail generation.'),
      );
    }

    client.busy = true;

    return new Promise<Blob>((resolve, reject) => {
      const signal = controller.signal;
      const cleanup = () => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', handleAbort);
      };

      const handleAbort = () => {
        cleanup();
        client.busy = false;
        try {
          client.worker.postMessage({
            type: 'render:cancel',
            requestId: workerRequestId,
          });
        } catch {
          // Ignore worker teardown races during cancellation.
        }
        this.workerRequests.delete(workerRequestId);
        reject(new DOMException('Thumbnail rendering canceled.', 'AbortError'));
      };

      if (signal.aborted) {
        handleAbort();
        return;
      }

      signal.addEventListener('abort', handleAbort, { once: true });
      this.workerRequests.set(workerRequestId, {
        resolve: (blob) => {
          cleanup();
          client.busy = false;
          resolve(blob);
        },
        reject: (error) => {
          cleanup();
          client.busy = false;
          reject(error);
        },
        client,
      });

      const timeoutId = setTimeout(() => {
        client.busy = false;
        try {
          client.worker.postMessage({
            type: 'render:cancel',
            requestId: workerRequestId,
          });
        } catch {
          // Ignore worker teardown races during timeout cancellation.
        }
        this.workerRequests.delete(workerRequestId);
        cleanup();
        reject(
          new PdfMasterError(
            ErrorCode.WorkerFailed,
            'Render worker timed out while generating a page preview. Falling back to canvas rendering.',
          ),
        );
      }, WORKER_RENDER_TIMEOUT_MS);

      const message: RenderWorkerRequest = {
        type: 'render',
        requestId: workerRequestId,
        documentId: request.documentId,
        pageId: request.pageId,
        file: request.sourceFile,
        pageIndex: request.pageIndex,
        maxWidth: request.maxWidth,
      };

      try {
        client.worker.postMessage(message);
      } catch (error) {
        cleanup();
        client.busy = false;
        this.workerRequests.delete(workerRequestId);
        reject(error);
      }
    });
  }

  private handleWorkerMessage(client: RenderWorkerClient, event: MessageEvent<RenderWorkerResponse>): void {
    const message = event.data;
    const pending = this.workerRequests.get(message.requestId);
    if (!pending) {
      return;
    }

    this.workerRequests.delete(message.requestId);
    client.busy = false;

    if (message.type === 'render:success') {
      pending.resolve(message.blob);
      return;
    }

    const error = new PdfMasterError(
      message.error.code,
      message.error.message,
      message.error.details,
      message.error.recoverable,
    );

    pending.reject(error);

    if (message.type === 'render:unsupported') {
      this.disableRenderWorkers(error);
    }
  }

  private handleWorkerError(client: RenderWorkerClient, event: ErrorEvent): void {
    const error =
      event.error instanceof Error
        ? event.error
        : new PdfMasterError(ErrorCode.WorkerFailed, event.message || 'Render worker failed unexpectedly.');

    for (const [requestId, pending] of this.workerRequests.entries()) {
      if (pending.client !== client) {
        continue;
      }
      pending.reject(error);
      this.workerRequests.delete(requestId);
    }

    client.worker.removeEventListener('message', client.handleMessage);
    client.worker.removeEventListener('error', client.handleError);
    client.worker.terminate();
    client.busy = false;
    client.terminated = true;
    this.syncQueueConcurrency();
  }

  private createRenderWorker(id: number): RenderWorkerClient {
    const worker = new Worker(new URL('../workers/render.worker.ts', import.meta.url), { type: 'module' });
    const client: RenderWorkerClient = {
      id,
      worker,
      busy: false,
      terminated: false,
      handleMessage: (event) => this.handleWorkerMessage(client, event),
      handleError: (event) => this.handleWorkerError(client, event),
    };

    worker.addEventListener('message', client.handleMessage);
    worker.addEventListener('error', client.handleError);
    return client;
  }

  private acquireWorker(): RenderWorkerClient | null {
    if (!this.workerAvailable) {
      return null;
    }

    return this.getActiveWorkers().find((client) => !client.busy) ?? null;
  }

  private disableRenderWorkers(error: PdfMasterError): void {
    for (const client of this.getActiveWorkers()) {
      for (const [requestId, pending] of this.workerRequests.entries()) {
        if (pending.client !== client) {
          continue;
        }
        pending.reject(error);
        this.workerRequests.delete(requestId);
      }

      client.worker.removeEventListener('message', client.handleMessage);
      client.worker.removeEventListener('error', client.handleError);
      client.worker.terminate();
      client.busy = false;
      client.terminated = true;
    }

    this.syncQueueConcurrency();
  }

  private syncQueueConcurrency(): void {
    const workerCount = this.getActiveWorkers().length;
    this.workerAvailable = workerCount > 0;
    this.queue.setConcurrency(workerCount > 0 ? workerCount : this.fallbackConcurrency);
  }

  private broadcastToWorkers(message: RenderWorkerMessage): void {
    for (const client of this.getActiveWorkers()) {
      client.worker.postMessage(message);
    }
  }

  private getActiveWorkers(): RenderWorkerClient[] {
    return this.renderWorkers.filter((client) => !client.terminated);
  }
}
