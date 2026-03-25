import { validatePdfFile } from '@/domain/validation';
import { toErrorModel } from '@/domain/errors';
import type { ErrorModel, IngestDocumentPayload, SourceFileModel } from '@/domain/types';
import type { IngestWorkerResponse } from '@/workers/protocols';
import { createId } from '@/utils/ids';
import { makeObjectUrl } from '@/utils/objectUrl';

export interface ImportedDocument {
  sourceFile: SourceFileModel;
  payload: IngestDocumentPayload;
  sourceUrl: string;
}

export interface ImportResult {
  imported: ImportedDocument[];
  errors: Array<{ fileName: string; error: ErrorModel }>;
}

export async function importPdfFiles(
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<ImportResult> {
  const worker = new Worker(new URL('../workers/ingest.worker.ts', import.meta.url), { type: 'module' });
  const imported: ImportedDocument[] = [];
  const errors: Array<{ fileName: string; error: ErrorModel }> = [];
  let completed = 0;

  try {
    await Promise.all(
      files.map(async (file) => {
        try {
          validatePdfFile(file);
          const sourceFile: SourceFileModel = {
            id: createId('source'),
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            type: file.type,
            file,
          };
          const documentId = createId('document');
          const payload = await inspectWithWorker(worker, { documentId, file });
          imported.push({
            sourceFile,
            payload,
            sourceUrl: makeObjectUrl(file),
          });
        } catch (error) {
          errors.push({ fileName: file.name, error: toErrorModel(error) });
        } finally {
          completed += 1;
          onProgress?.(completed, files.length);
        }
      }),
    );
  } finally {
    worker.terminate();
  }

  return { imported, errors };
}

function inspectWithWorker(
  worker: Worker,
  input: { documentId: string; file: File },
): Promise<IngestDocumentPayload> {
  return new Promise((resolve, reject) => {
    const requestId = createId('ingest');

    const handleMessage = (event: MessageEvent<IngestWorkerResponse>) => {
      if (event.data.requestId !== requestId) {
        return;
      }

      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      if (event.data.type === 'ingest:success') {
        resolve(event.data.payload);
        return;
      }
      reject(event.data.error);
    };

    const handleError = (event: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      reject(event.error ?? new Error(event.message));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage({
      type: 'ingest',
      requestId,
      documentId: input.documentId,
      file: input.file,
    });
  });
}
