import type { DocumentEntity, PageEntity, PdfAppState } from '@/domain/types';

export function selectActiveDocument(state: PdfAppState): DocumentEntity | undefined {
  return state.ui.activeDocumentId ? state.documents[state.ui.activeDocumentId] : state.documents[state.documentOrder[0]];
}

export function selectOrderedPages(state: PdfAppState): PageEntity[] {
  return state.pageOrder.map((pageId) => state.pages[pageId]).filter(Boolean) as PageEntity[];
}

export function selectPagesByDocument(state: PdfAppState): Array<{ document: DocumentEntity; pages: PageEntity[] }> {
  return state.documentOrder
    .map((documentId) => {
      const document = state.documents[documentId];
      if (!document) {
        return null;
      }
      const pages = (state.pageOrderByDocument[documentId] ?? []).map((pageId) => state.pages[pageId]).filter(Boolean) as PageEntity[];
      return { document, pages };
    })
    .filter(Boolean) as Array<{ document: DocumentEntity; pages: PageEntity[] }>;
}

export function selectSelectedPageCount(state: PdfAppState): number {
  return state.selectedPageIds.length;
}

export function selectExportablePageCount(state: PdfAppState): number {
  return state.pageOrder.length;
}

export function selectHasWorkspace(state: PdfAppState): boolean {
  return state.pageOrder.length > 0;
}
