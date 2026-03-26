import type { SelectionState } from '@/domain/types';

interface SelectionInput {
  pageOrder: string[];
  currentSelection: SelectionState;
  targetPageId: string;
  additive: boolean;
  range: boolean;
}

export function computeSelection(input: SelectionInput): SelectionState {
  const { pageOrder, currentSelection, targetPageId, additive, range } = input;
  const selected = new Set(currentSelection.selectedPageIds);

  if (range && currentSelection.anchorPageId) {
    const anchorIndex = pageOrder.indexOf(currentSelection.anchorPageId);
    const targetIndex = pageOrder.indexOf(targetPageId);
    if (anchorIndex !== -1 && targetIndex !== -1) {
      const start = Math.min(anchorIndex, targetIndex);
      const end = Math.max(anchorIndex, targetIndex);
      const nextIds = pageOrder.slice(start, end + 1);
      return {
        selectedPageIds: additive ? uniquePageIds([...selected, ...nextIds], pageOrder) : nextIds,
        selectedDocumentIds: [],
        anchorPageId: currentSelection.anchorPageId,
      };
    }
  }

  if (additive) {
    if (selected.has(targetPageId)) {
      selected.delete(targetPageId);
    } else {
      selected.add(targetPageId);
    }

    return {
      selectedPageIds: uniquePageIds([...selected], pageOrder),
      selectedDocumentIds: [],
      anchorPageId: targetPageId,
    };
  }

  return {
    selectedPageIds: [targetPageId],
    selectedDocumentIds: [],
    anchorPageId: targetPageId,
  };
}

export function selectAllInDocument(pageIds: string[]): SelectionState {
  return {
    selectedPageIds: [...pageIds],
    selectedDocumentIds: [],
    anchorPageId: pageIds[0],
  };
}

export function clearSelection(): SelectionState {
  return {
    selectedPageIds: [],
    selectedDocumentIds: [],
    anchorPageId: undefined,
  };
}

export function sortPageIdsByWorkspace(pageIds: string[], pageOrder: string[]): string[] {
  const selected = new Set(pageIds);
  return pageOrder.filter((pageId) => selected.has(pageId));
}

function uniquePageIds(pageIds: string[], pageOrder: string[]): string[] {
  const selected = new Set(pageIds);
  return pageOrder.filter((pageId) => selected.has(pageId));
}
