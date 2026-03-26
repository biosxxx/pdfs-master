export function stripPdfExtension(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '');
}

export function sanitizeBaseName(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'pdf-master-export';
}

export function buildPdfFileName(baseName: string, suffix?: string): string {
  const cleanBase = sanitizeBaseName(stripPdfExtension(baseName));
  return `${cleanBase}${suffix ? `-${suffix}` : ''}.pdf`;
}
