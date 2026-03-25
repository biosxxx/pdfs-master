import type { JSX } from 'react';

export function PdfMasterEmbed(): JSX.Element {
  return (
    <iframe
      src="/utilities/pdf-master/"
      title="PDF Master"
      loading="lazy"
      style={{ width: '100%', minHeight: '80vh', border: 0, borderRadius: 16 }}
    />
  );
}
