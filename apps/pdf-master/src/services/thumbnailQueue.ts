import { ErrorCode, PdfMasterError } from '@/domain/errors';
import type { PdfReader } from '@/domain/types';
import type { RenderWorkerRequest, RenderWorkerResponse } from '@/workers/protocols';
import { createId } from '@/utils/ids';
import { LruMap } from '@/utils/lru';
import { makeObjectUrl, revokeObjectUrl } from '@/utils/objectUrl';
import { PromiseQueue } from '@/utils/promiseQueue';

interface ThumbnailRequest {
  pageId: string;
  documentId: string;
  sourceFile: File;
  pageIndex: number;
  maxWidth: number;
}

const WORKER_RENDER_TIMEOUT_MS = 4000;

export class ThumbnailQueue {
  private readonly queue = new PromiseQueue<string>(2);
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
  private readonly renderWorker =
    typeof Worker !== 'undefined'
      ? new Worker(new URL('../workers/render.worker.ts', import.meta.url), { type: 'module' })
      : null;
  private readonly workerRequests = new Map<
    string,
    {
      resolve: (blob: Blob) => void;
      reject: (error: unknown) => void;
    }
  >();
  private workerAvailable = Boolean(this.renderWorker);

  constructor(private readonly reader: PdfReader) {
    this.renderWorker?.addEventListener('message', this.handleWorkerMessage);
    this.renderWorker?.addEventListener('error', this.handleWorkerError);
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
      if (pending.workerRequestId) {
        this.renderWorker?.postMessage({
          type: 'render:cancel',
          requestId: pending.workerRequestId,
        });
        this.workerRequests.delete(pending.workerRequestId);
      }
      pending.controller.abort();
      this.pending.delete(pageId);
    }
    this.cache.delete(pageId);
  }

  cancelDocument(documentId: string): void {
    for (const [pageId, pending] of this.pending.entries()) {
      if (pending.documentId === documentId) {
        if (pending.workerRequestId) {
          this.renderWorker?.postMessage({
            type: 'render:cancel',
            requestId: pending.workerRequestId,
          });
          this.workerRequests.delete(pending.workerRequestId);
        }
        pending.controller.abort();
        this.pending.delete(pageId);
      }
    }
    this.renderWorker?.postMessage({ type: 'render:release-document', documentId });
    void this.reader.destroy(documentId);
  }

  clear(): void {
    for (const [pageId, pending] of this.pending.entries()) {
      if (pending.workerRequestId) {
        this.renderWorker?.postMessage({
          type: 'render:cancel',
          requestId: pending.workerRequestId,
        });
        this.workerRequests.delete(pending.workerRequestId);
      }
      pending.controller.abort();
      this.pending.delete(pageId);
    }
    this.renderWorker?.postMessage({ type: 'render:reset' });
    this.cache.clear();
  }

  dispose(): void {
    this.clear();
    this.renderWorker?.removeEventListener('message', this.handleWorkerMessage);
    this.renderWorker?.removeEventListener('error', this.handleWorkerError);
    this.renderWorker?.terminate();
  }

  private async renderThumbnail(
    request: ThumbnailRequest,
    controller: AbortController,
    workerRequestId: string,
  ): Promise<Blob> {
    if (this.workerAvailable && this.renderWorker) {
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
          this.workerAvailable = false;
        } else if (error instanceof Error && error.message.includes('OffscreenCanvas')) {
          this.workerAvailable = false;
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
    const worker = this.renderWorker;
    if (!worker) {
      return Promise.reject(
        new PdfMasterError(ErrorCode.UnsupportedOperation, 'Render worker is not available in this environment.'),
      );
    }

    return new Promise<Blob>((resolve, reject) => {
      const signal = controller.signal;
      const cleanup = () => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', handleAbort);
      };

      const handleAbort = () => {
        cleanup();
        worker.postMessage({
          type: 'render:cancel',
          requestId: workerRequestId,
        });
        this.workerRequests.delete(workerRequestId);
        reject(new DOMException('Thumbnail rendering canceled.', 'AbortError'));
      };

      signal.addEventListener('abort', handleAbort, { once: true });
      this.workerRequests.set(workerRequestId, {
        resolve: (blob) => {
          cleanup();
          resolve(blob);
        },
        reject: (error) => {
          cleanup();
          reject(error);
        },
      });

      const timeoutId = setTimeout(() => {
        worker.postMessage({
          type: 'render:cancel',
          requestId: workerRequestId,
        });
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
      worker.postMessage(message);
    });
  }

  private readonly handleWorkerMessage = (event: MessageEvent<RenderWorkerResponse>) => {
    const message = event.data;
    const pending = this.workerRequests.get(message.requestId);
    if (!pending) {
      return;
    }

    this.workerRequests.delete(message.requestId);

    if (message.type === 'render:success') {
      pending.resolve(message.blob);
      return;
    }

    if (message.type === 'render:unsupported') {
      pending.reject(
        new PdfMasterError(
          message.error.code,
          message.error.message,
          message.error.details,
          message.error.recoverable,
        ),
      );
      return;
    }

    pending.reject(
      new PdfMasterError(
        message.error.code,
        message.error.message,
        message.error.details,
        message.error.recoverable,
      ),
    );
  };

  private readonly handleWorkerError = (event: ErrorEvent) => {
    this.workerAvailable = false;
    for (const [requestId, pending] of this.workerRequests.entries()) {
      pending.reject(event.error ?? new Error(event.message));
      this.workerRequests.delete(requestId);
    }
  };
}
