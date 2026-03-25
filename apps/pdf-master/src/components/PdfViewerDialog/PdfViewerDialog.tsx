import clsx from 'clsx';

interface PdfViewerDialogProps {
  open: boolean;
  title: string;
  pageNumber: number;
  pdfUrl?: string;
  loading: boolean;
  loadingMessage?: string;
  progress?: number;
  error?: string;
  expanded: boolean;
  onClose: () => void;
  onToggleExpanded: () => void;
  onOpenInBrowser: () => void;
  onDownload: () => void;
}

export function PdfViewerDialog({
  open,
  title,
  pageNumber,
  pdfUrl,
  loading,
  loadingMessage,
  progress,
  error,
  expanded,
  onClose,
  onToggleExpanded,
  onOpenInBrowser,
  onDownload,
}: PdfViewerDialogProps) {
  if (!open) {
    return null;
  }

  const iframeSrc = pdfUrl ? `${pdfUrl}#page=${pageNumber}&zoom=page-fit&toolbar=1&navpanes=0&statusbar=0` : undefined;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/44 p-3 backdrop-blur-sm">
      <div
        className={clsx(
          'flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
          expanded ? 'h-[calc(100vh-24px)] max-w-none' : 'h-[min(88vh,920px)] max-w-[min(96vw,1480px)]',
        )}
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">PDF viewer</p>
            <h3 className="truncate text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Page {pageNumber}. Search with Cmd/Ctrl+F, select and copy text directly in the embedded viewer. Browser-native annotations/comments are available via "Open in browser".
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onOpenInBrowser}
              disabled={!pdfUrl || loading}
            >
              Open in browser
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onDownload}
              disabled={!pdfUrl || loading}
            >
              Download
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onToggleExpanded}
            >
              {expanded ? 'Windowed' : 'Expand'}
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[color:var(--pm-accent)] transition-all"
                  style={{ width: `${Math.max(8, progress ?? 12)}%` }}
                />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-800">Preparing assembled PDF viewer</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{loadingMessage ?? 'Collecting the current workspace order, page transforms, and form values.'}</p>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <h4 className="text-base font-semibold text-slate-900">Viewer could not be opened</h4>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{error}</p>
            </div>
          ) : iframeSrc ? (
            <iframe
              key={`${iframeSrc}:${expanded ? 'expanded' : 'windowed'}`}
              title={title}
              src={iframeSrc}
              className="h-full w-full border-0 bg-white"
              allow="clipboard-read; clipboard-write"
              allowFullScreen
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
