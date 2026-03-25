import { describe, expect, it } from 'vitest';
import { inspectPdfFile } from '@/services/pdfInspection';
import { createFormPdfFile } from '@/test/pdfFixtures';

describe('pdf inspection integration', () => {
  it('extracts page inventory and AcroForm metadata from a real PDF', async () => {
    const file = await createFormPdfFile();

    const payload = await inspectPdfFile(file, 'doc-form');

    expect(payload.pageCount).toBe(1);
    expect(payload.pages[0]?.id).toBe('doc-form-page-1');
    expect(payload.hasForms).toBe(true);
    expect(payload.formFields.map((field) => field.name)).toEqual(['name', 'approved', 'status']);
  });
});
