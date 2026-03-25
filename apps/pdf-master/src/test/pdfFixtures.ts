import { PDFDocument } from 'pdf-lib';

export async function createPdfFile(name: string, sizes: Array<[number, number]>): Promise<File> {
  const pdf = await PDFDocument.create();
  sizes.forEach(([width, height], index) => {
    const page = pdf.addPage([width, height]);
    page.drawText(`Fixture ${index + 1}`, {
      x: 24,
      y: height - 36,
      size: 18,
    });
  });

  return createMemoryPdfFile(name, await pdf.save());
}

export async function createFormPdfFile(name = 'form.pdf'): Promise<File> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const form = pdf.getForm();

  const textField = form.createTextField('name');
  textField.addToPage(page, { x: 48, y: 700, width: 220, height: 28 });

  const checkBox = form.createCheckBox('approved');
  checkBox.addToPage(page, { x: 48, y: 646, width: 18, height: 18 });

  const dropdown = form.createDropdown('status');
  dropdown.addOptions(['Open', 'Closed']);
  dropdown.addToPage(page, { x: 48, y: 592, width: 180, height: 28 });

  return createMemoryPdfFile(name, await pdf.save());
}

function createMemoryPdfFile(name: string, bytes: Uint8Array): File {
  const normalizedBytes = Uint8Array.from(bytes);
  const buffer = normalizedBytes.buffer.slice(
    normalizedBytes.byteOffset,
    normalizedBytes.byteOffset + normalizedBytes.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });

  return Object.assign(blob, {
    name,
    lastModified: 0,
    async arrayBuffer() {
      return buffer.slice(0);
    },
  }) as File;
}
