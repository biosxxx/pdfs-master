export function makeObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url?: string): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
