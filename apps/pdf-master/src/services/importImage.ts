import { PDFDocument } from 'pdf-lib';

/** MIME types that pdf-lib can embed natively. */
const NATIVE_JPEG = new Set(['image/jpeg', 'image/jpg']);
const NATIVE_PNG = new Set(['image/png']);

/** All image MIME types we accept for import. */
export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/svg+xml',
]);

/**
 * Accept string for file inputs that includes both PDF and image types.
 */
export const ACCEPT_IMPORT_TYPES =
  'application/pdf,image/jpeg,image/png,image/webp,image/bmp,image/gif,image/tiff,image/svg+xml';

export interface ImageToPdfResult {
  pdfFile: File;
  width: number;
  height: number;
}

/**
 * Convert an image File into a single-page PDF File using pdf-lib.
 *
 * For JPEG/PNG — uses pdf-lib's native embedders.
 * For other formats (WebP, BMP, GIF, TIFF, SVG) — first converts to PNG
 * via an offscreen canvas, then embeds into pdf-lib.
 */
export async function convertImageToPdf(imageFile: File): Promise<ImageToPdfResult> {
  let imageBytes: Uint8Array;
  let mimeType = imageFile.type.toLowerCase();

  // For non-native formats, convert through canvas → PNG
  if (!NATIVE_JPEG.has(mimeType) && !NATIVE_PNG.has(mimeType)) {
    const converted = await convertToCanvasPng(imageFile);
    imageBytes = converted.bytes;
    mimeType = 'image/png';
  } else {
    imageBytes = new Uint8Array(await imageFile.arrayBuffer());
  }

  const pdfDoc = await PDFDocument.create();

  let image;
  if (NATIVE_JPEG.has(mimeType)) {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    image = await pdfDoc.embedPng(imageBytes);
  }

  const { width, height } = image.scale(1);
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });

  const pdfBytes = await pdfDoc.save();
  const baseName = imageFile.name.replace(/\.[^.]+$/, '');
  const pdfFile = new File([Uint8Array.from(pdfBytes)], `${baseName}.pdf`, {
    type: 'application/pdf',
    lastModified: imageFile.lastModified,
  });

  return { pdfFile, width, height };
}

/**
 * Converts any image to PNG bytes by drawing it on an offscreen canvas.
 */
async function convertToCanvasPng(file: File): Promise<{ bytes: Uint8Array }> {
  const blobUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(blobUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas 2D context for image conversion.');
    }

    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Canvas toBlob returned null.'))),
        'image/png',
      );
    });

    const buffer = await blob.arrayBuffer();
    return { bytes: new Uint8Array(buffer) };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (_event, _source, _lineno, _colno, error) =>
      reject(error ?? new Error('Failed to load image for conversion.'));
    img.src = src;
  });
}
