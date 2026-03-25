/// <reference lib="webworker" />
import { ErrorCode, toErrorModel } from '@/domain/errors';
import { inspectPdfFile } from '@/services/pdfInspection';
import type { IngestWorkerMessage, IngestWorkerRequest, IngestWorkerResponse } from '@/workers/protocols';

self.onmessage = async (event: MessageEvent<IngestWorkerMessage>) => {
  const message = event.data;
  if (message.type !== 'ingest') {
    return;
  }

  try {
    const payload = await inspectPdf(message);
    const response: IngestWorkerResponse = {
      type: 'ingest:success',
      requestId: message.requestId,
      payload,
    };
    self.postMessage(response);
  } catch (error) {
    const messageText = error instanceof Error ? error.message.toLowerCase() : '';
    const fallbackCode = messageText.includes('encrypted') ? ErrorCode.EncryptedPdf : ErrorCode.InvalidPdf;
    const response: IngestWorkerResponse = {
      type: 'ingest:error',
      requestId: message.requestId,
      error: toErrorModel(error, fallbackCode),
    };
    self.postMessage(response);
  }
};

async function inspectPdf(message: IngestWorkerRequest) {
  return inspectPdfFile(message.file, message.documentId);
}
