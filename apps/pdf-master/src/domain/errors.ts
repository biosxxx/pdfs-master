import type { ErrorModel } from '@/domain/types';

export const ErrorCode = {
  InvalidFileType: 'invalid-file-type',
  FileTooLarge: 'file-too-large',
  InvalidPdf: 'invalid-pdf',
  EncryptedPdf: 'encrypted-pdf',
  ThumbnailRenderFailed: 'thumbnail-render-failed',
  ExportFailed: 'export-failed',
  WorkerFailed: 'worker-failed',
  ValidationFailed: 'validation-failed',
  UnsupportedOperation: 'unsupported-operation',
  Unknown: 'unknown',
} as const;

export class PdfMasterError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: string,
    public readonly recoverable = true,
  ) {
    super(message);
    this.name = 'PdfMasterError';
  }
}

export function toErrorModel(error: unknown, fallbackCode: string = ErrorCode.Unknown): ErrorModel {
  if (error instanceof PdfMasterError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      recoverable: error.recoverable,
    };
  }

  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: error.message,
      details: error.stack,
      recoverable: true,
    };
  }

  return {
    code: fallbackCode,
    message: 'Unknown PDF processing error.',
    recoverable: true,
  };
}
