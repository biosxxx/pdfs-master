import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { PdfMasterError, ErrorCode } from '@/domain/errors';
import type { PdfMetadata, PdfReader } from '@/domain/types';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface CachedDocument {
  loadingTask: PDFDocumentLoadingTask;
  document: Promise<PDFDocumentProxy>;
}

export class PdfjsReader implements PdfReader {
  private readonly cache = new Map<string, CachedDocument>();

  async loadDocument(documentId: string, sourceFile: File): Promise<{ documentId: string; pageCount: number }> {
    const document = await this.getDocument(documentId, sourceFile);
    return { documentId, pageCount: document.numPages };
  }

  async renderPageThumbnail(input: {
    documentId: string;
    sourceFile: File;
    pageIndex: number;
    maxWidth: number;
    signal?: AbortSignal;
  }): Promise<Blob> {
    const pdfDocument = await this.getDocument(input.documentId, input.sourceFile);
    const page = await pdfDocument.getPage(input.pageIndex + 1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = input.maxWidth / baseViewport.width;
    const viewport = page.getViewport({ scale: Math.max(scale, 0.2) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new PdfMasterError(ErrorCode.ThumbnailRenderFailed, 'Canvas rendering context is not available.');
    }

    const renderTask = page.render({ canvas, canvasContext: context, viewport });
    const abortHandler = () => renderTask.cancel();
    input.signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      await renderTask.promise;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
            return;
          }
          reject(new PdfMasterError(ErrorCode.ThumbnailRenderFailed, 'Thumbnail rendering returned an empty blob.'));
        }, 'image/png');
      });
      return blob;
    } catch (error) {
      if (input.signal?.aborted) {
        throw new DOMException('Thumbnail rendering canceled.', 'AbortError');
      }
      throw error;
    } finally {
      input.signal?.removeEventListener('abort', abortHandler);
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  async getMetadata(documentId: string): Promise<PdfMetadata> {
    const cached = this.cache.get(documentId);
    if (!cached) {
      return {};
    }

    const pdfDocument = await cached.document;
    const metadata = await pdfDocument.getMetadata();
    const info = metadata.info as Record<string, string | undefined>;

    return {
      title: info.Title ?? undefined,
      author: info.Author ?? undefined,
      subject: info.Subject ?? undefined,
      creator: info.Creator ?? undefined,
      producer: info.Producer ?? undefined,
      creationDate: info.CreationDate ?? undefined,
      modificationDate: info.ModDate ?? undefined,
    };
  }

  getCapabilities() {
    return {
      supportsTextExtraction: false,
      supportsOffscreenRendering: typeof OffscreenCanvas !== 'undefined',
    };
  }

  async destroy(documentId: string): Promise<void> {
    const cached = this.cache.get(documentId);
    if (!cached) {
      return;
    }

    const document = await cached.document.catch(() => null);
    this.cache.delete(documentId);
    cached.loadingTask.destroy();
    await document?.destroy();
  }

  private async getDocument(documentId: string, sourceFile: File): Promise<PDFDocumentProxy> {
    const cached = this.cache.get(documentId);
    if (cached) {
      return cached.document;
    }

    const bytes = new Uint8Array(await sourceFile.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      useWorkerFetch: false,
      isOffscreenCanvasSupported: typeof OffscreenCanvas !== 'undefined',
      stopAtErrors: false,
    });
    const document = loadingTask.promise;
    this.cache.set(documentId, { loadingTask, document });
    return document;
  }
}
