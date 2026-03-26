import type { DocumentEntity } from '@/domain/types';

export function getMetadataRows(document: DocumentEntity): Array<{ label: string; value: string }> {
  const rows = [
    { label: 'File', value: document.name },
    { label: 'Pages', value: String(document.pageCount) },
    { label: 'Forms', value: document.hasForms ? `${document.formFields.length} fields detected` : 'No forms' },
  ];

  if (document.metadata.title) {
    rows.push({ label: 'Title', value: document.metadata.title });
  }
  if (document.metadata.author) {
    rows.push({ label: 'Author', value: document.metadata.author });
  }
  if (document.metadata.subject) {
    rows.push({ label: 'Subject', value: document.metadata.subject });
  }
  if (document.metadata.creator) {
    rows.push({ label: 'Creator', value: document.metadata.creator });
  }
  if (document.metadata.producer) {
    rows.push({ label: 'Producer', value: document.metadata.producer });
  }
  if (document.metadata.creationDate) {
    rows.push({ label: 'Created', value: document.metadata.creationDate });
  }
  if (document.metadata.modificationDate) {
    rows.push({ label: 'Modified', value: document.metadata.modificationDate });
  }

  return rows;
}
