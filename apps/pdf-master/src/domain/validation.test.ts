import { describe, expect, it } from 'vitest';
import { parseRangeGroups, validatePdfFile } from '@/domain/validation';

describe('validation helpers', () => {
  it('parses multiple split groups and preserves requested order', () => {
    expect(parseRangeGroups('1-3,5;6-4', 6)).toEqual([
      [0, 1, 2, 4],
      [5, 4, 3],
    ]);
  });

  it('rejects non-pdf files', () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    expect(() => validatePdfFile(file)).toThrow(/not a PDF/i);
  });
});
