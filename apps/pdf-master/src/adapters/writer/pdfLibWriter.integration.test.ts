import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PdfLibWriter } from '@/adapters/writer/pdfLibWriter';
import { createFormPdfFile, createPdfFile } from '@/test/pdfFixtures';

describe('PdfLibWriter integration', () => {
  it('merges pages in the requested order and preserves rotations', async () => {
    const writer = new PdfLibWriter();
    const sourceA = await createPdfFile('source-a.pdf', [
      [300, 400],
      [320, 420],
    ]);
    const sourceB = await createPdfFile('source-b.pdf', [
      [500, 600],
      [520, 620],
    ]);

    const bytes = await writer.mergeDocuments({
      documents: [
        { documentId: 'doc-a', sourceFile: sourceA, formValues: {}, flatten: false },
        { documentId: 'doc-b', sourceFile: sourceB, formValues: {}, flatten: false },
      ],
      pages: [
        { pageId: '1', documentId: 'doc-b', sourcePageIndex: 1, rotation: 0, label: 'B2' },
        { pageId: '2', documentId: 'doc-a', sourcePageIndex: 1, rotation: 90, label: 'A2' },
        { pageId: '3', documentId: 'doc-a', sourcePageIndex: 0, rotation: 0, label: 'A1' },
      ],
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(3);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 520, height: 620 });
    expect(pdf.getPage(1).getSize()).toEqual({ width: 320, height: 420 });
    expect(pdf.getPage(1).getRotation().angle).toBe(90);
    expect(pdf.getPage(2).getSize()).toEqual({ width: 300, height: 400 });
  });

  it('fills and flattens simple AcroForms', async () => {
    const writer = new PdfLibWriter();
    const source = await createFormPdfFile();

    const filledBytes = await writer.fillForm({
      sourceFile: source,
      values: {
        name: 'Alice',
        approved: true,
        status: 'Closed',
      },
    });

    const filledPdf = await PDFDocument.load(filledBytes);
    expect(filledPdf.getForm().getTextField('name').getText()).toBe('Alice');
    expect(filledPdf.getForm().getCheckBox('approved').isChecked()).toBe(true);
    expect(filledPdf.getForm().getDropdown('status').getSelected()).toEqual(['Closed']);

    const flattenedBytes = await writer.flattenForm({
      sourceFile: source,
      values: {
        name: 'Alice',
        approved: true,
        status: 'Closed',
      },
    });

    const flattenedPdf = await PDFDocument.load(flattenedBytes);
    expect(flattenedPdf.getForm().getFields()).toHaveLength(0);
  });

  it('splits a PDF into multiple outputs by page groups', async () => {
    const writer = new PdfLibWriter();
    const source = await createPdfFile('split-me.pdf', [
      [300, 400],
      [310, 410],
      [320, 420],
    ]);

    const files = await writer.splitDocument({
      documentId: 'doc-split',
      sourceFile: source,
      rangeGroups: [
        [0, 1],
        [2],
      ],
      formValues: {},
      flatten: false,
      baseFileName: 'split-me',
    });

    expect(files).toHaveLength(2);
    expect(files.map((file) => file.name)).toEqual(['split-me-part-1.pdf', 'split-me-part-2.pdf']);

    const firstPdf = await PDFDocument.load(files[0].bytes);
    const secondPdf = await PDFDocument.load(files[1].bytes);
    expect(firstPdf.getPageCount()).toBe(2);
    expect(secondPdf.getPageCount()).toBe(1);
  });
});
