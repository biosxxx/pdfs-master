import { ErrorCode, PdfMasterError } from '@/domain/errors';

const MAX_FILE_SIZE_BYTES = 128 * 1024 * 1024;
const pdfFilePattern = /\.pdf$/i;

export function validatePdfFile(file: File): void {
  const isPdfMime = file.type === 'application/pdf' || file.type === '';
  const matchesExtension = pdfFilePattern.test(file.name);

  if (!isPdfMime && !matchesExtension) {
    throw new PdfMasterError(ErrorCode.InvalidFileType, `${file.name} is not a PDF file.`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new PdfMasterError(
      ErrorCode.FileTooLarge,
      `${file.name} exceeds the ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB local processing limit.`,
    );
  }
}

export function parseRangeGroups(input: string, pageCount: number): number[][] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new PdfMasterError(ErrorCode.ValidationFailed, 'Enter at least one page range to split the document.');
  }

  return trimmed
    .split(';')
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => expandRangeGroup(group, pageCount));
}

function expandRangeGroup(group: string, pageCount: number): number[] {
  const selected = new Set<number>();
  const ordered: number[] = [];

  for (const token of group.split(',').map((value) => value.trim()).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) {
      throw new PdfMasterError(ErrorCode.ValidationFailed, `Invalid range token: "${token}".`);
    }

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      throw new PdfMasterError(
        ErrorCode.ValidationFailed,
        `Range "${token}" is outside the active document page count (${pageCount}).`,
      );
    }

    const direction = start <= end ? 1 : -1;
    for (let page = start; direction === 1 ? page <= end : page >= end; page += direction) {
      const pageIndex = page - 1;
      if (!selected.has(pageIndex)) {
        selected.add(pageIndex);
        ordered.push(pageIndex);
      }
    }
  }

  if (!ordered.length) {
    throw new PdfMasterError(ErrorCode.ValidationFailed, 'Each split group must contain at least one page.');
  }

  return ordered;
}
