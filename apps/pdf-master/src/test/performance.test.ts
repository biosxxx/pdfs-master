import { describe, expect, it } from 'vitest';
import { PdfLibWriter } from '@/adapters/writer/pdfLibWriter';
import { inspectPdfFile } from '@/services/pdfInspection';
import { createPdfFile } from '@/test/pdfFixtures';

describe('performance baseline', () => {
  it('imports and merges a medium local fixture within a reasonable budget', async () => {
    const writer = new PdfLibWriter();
    const source = await createPdfFile(
      'medium.pdf',
      Array.from({ length: 24 }, (_, index) => [420 + index, 594 + index] as [number, number]),
    );

    const inspectStart = performance.now();
    const inspected = await inspectPdfFile(source, 'doc-medium');
    const inspectDuration = performance.now() - inspectStart;

    const mergeStart = performance.now();
    await writer.mergeDocuments({
      documents: [{ documentId: inspected.id, sourceFile: source, formValues: {}, flatten: false }],
      pages: inspected.pages.map((page) => ({
        pageId: page.id,
        documentId: inspected.id,
        sourcePageIndex: page.sourcePageIndex,
        rotation: 0,
        label: page.label,
      })),
    });
    const mergeDuration = performance.now() - mergeStart;

    expect(inspectDuration).toBeLessThan(4_000);
    expect(mergeDuration).toBeLessThan(6_000);
  });
});
