import { describe, expect, it } from 'vitest';
import {
  addDocumentToWorkspace,
  deletePagesFromWorkspace,
  emptyWorkspace,
  reorderDocumentsInWorkspace,
  reorderPagesInWorkspace,
} from '@/domain/commands';
import type { IngestDocumentPayload, SourceFileModel } from '@/domain/types';

function createSourceFile(name: string): SourceFileModel {
  const file = new File(['fixture'], name, { type: 'application/pdf' });
  return {
    id: `${name}-source`,
    name,
    size: file.size,
    lastModified: 0,
    type: file.type,
    file,
  };
}

function createPayload(documentId: string, pageCount: number): IngestDocumentPayload {
  return {
    id: documentId,
    name: `${documentId}.pdf`,
    pageCount,
    metadata: {},
    hasForms: false,
    formFields: [],
    pages: Array.from({ length: pageCount }, (_, index) => ({
      id: `${documentId}-page-${index + 1}`,
      sourcePageIndex: index,
      width: 400 + index,
      height: 600 + index,
      label: `Page ${index + 1}`,
    })),
  };
}

describe('workspace commands', () => {
  it('reorders selected pages as a block', () => {
    let snapshot = emptyWorkspace();
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('a.pdf'), createPayload('doc-a', 3), 'blob:a');
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('b.pdf'), createPayload('doc-b', 2), 'blob:b');

    const next = reorderPagesInWorkspace(
      snapshot,
      ['doc-a-page-2', 'doc-a-page-3'],
      'doc-b-page-2',
      'after',
    );

    expect(next.pageOrder).toEqual([
      'doc-a-page-1',
      'doc-b-page-1',
      'doc-b-page-2',
      'doc-a-page-2',
      'doc-a-page-3',
    ]);
  });

  it('removes empty documents when all of their pages are deleted', () => {
    let snapshot = emptyWorkspace();
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('a.pdf'), createPayload('doc-a', 2), 'blob:a');
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('b.pdf'), createPayload('doc-b', 1), 'blob:b');

    const next = deletePagesFromWorkspace(snapshot, ['doc-b-page-1']);

    expect(next.documentOrder).toEqual(['doc-a']);
    expect(next.documents['doc-b']).toBeUndefined();
    expect(next.pageOrder).toEqual(['doc-a-page-1', 'doc-a-page-2']);
  });

  it('reorders documents while preserving each document page sequence', () => {
    let snapshot = emptyWorkspace();
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('a.pdf'), createPayload('doc-a', 2), 'blob:a');
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('b.pdf'), createPayload('doc-b', 2), 'blob:b');
    snapshot = addDocumentToWorkspace(snapshot, createSourceFile('c.pdf'), createPayload('doc-c', 1), 'blob:c');

    const next = reorderDocumentsInWorkspace(snapshot, 'doc-c', 'doc-a', 'before');

    expect(next.documentOrder).toEqual(['doc-c', 'doc-a', 'doc-b']);
    expect(next.pageOrder).toEqual([
      'doc-c-page-1',
      'doc-a-page-1',
      'doc-a-page-2',
      'doc-b-page-1',
      'doc-b-page-2',
    ]);
  });
});
