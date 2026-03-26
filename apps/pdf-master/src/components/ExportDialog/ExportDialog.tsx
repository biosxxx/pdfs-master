import clsx from 'clsx';
import type { DocumentEntity, ExportMode } from '@/domain/types';

interface ExportDialogProps {
  open: boolean;
  exportMode: ExportMode;
  fileName: string;
  splitRangeInput: string;
  activeDocument?: DocumentEntity;
  selectedCount: number;
  pageCount: number;
  onClose: () => void;
  onFileNameChange: (value: string) => void;
  onModeChange: (mode: ExportMode) => void;
  onSplitRangeChange: (value: string) => void;
  onSubmit: () => void;
}

export function ExportDialog({
  open,
  exportMode,
  fileName,
  splitRangeInput,
  activeDocument,
  selectedCount,
  pageCount,
  onClose,
  onFileNameChange,
  onModeChange,
  onSplitRangeChange,
  onSubmit,
}: ExportDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Export</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Build the output package</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose whether to export the whole workspace, extract the current selection, or split the active
              document into multiple output PDFs.
            </p>
          </div>
          <button type="button" className="m-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid gap-3 border-t border-slate-200 px-5 py-4 md:grid-cols-3">
          <ModeCard
            title="Workspace"
            description={`${pageCount} pages in current order`}
            active={exportMode.kind === 'workspace'}
            onClick={() => onModeChange({ kind: 'workspace' })}
          />
          <ModeCard
            title="Selection"
            description={selectedCount ? `${selectedCount} selected pages` : 'No pages selected'}
            active={exportMode.kind === 'selection'}
            disabled={!selectedCount}
            onClick={() => onModeChange({ kind: 'selection', pageIds: activeDocument ? [] : [] })}
          />
          <ModeCard
            title="Split"
            description={activeDocument ? `Split ${activeDocument.name}` : 'Choose an active document first'}
            active={exportMode.kind === 'split'}
            disabled={!activeDocument}
            onClick={() =>
              activeDocument &&
              onModeChange({
                kind: 'split',
                documentId: activeDocument.id,
                rangeGroups: exportMode.kind === 'split' ? exportMode.rangeGroups : [[0]],
              })
            }
          />
        </div>

        <div className="mx-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-900">File name</span>
            <input
              value={fileName}
              onChange={(event) => onFileNameChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
              placeholder="pdf-master-export"
            />
          </label>

          {exportMode.kind === 'split' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">Split ranges</span>
              <input
                value={splitRangeInput}
                onChange={(event) => onSplitRangeChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                placeholder="1-3;4-6;7-10"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">Use commas inside one output file and semicolons to create separate PDFs. Example: `1-3,5;6-8`.</p>
            </label>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-600">
            {exportMode.kind === 'workspace' && 'The full workspace order will be exported as one PDF.'}
            {exportMode.kind === 'selection' && 'Only the currently selected pages will be exported.'}
            {exportMode.kind === 'split' && 'Each split group will produce a separate PDF download.'}
          </p>
          <button
            type="button"
            className="rounded-lg bg-[color:var(--pm-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--pm-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onSubmit}
            disabled={exportMode.kind === 'selection' ? !selectedCount : exportMode.kind === 'split' ? !activeDocument : !pageCount}
          >
            Generate download
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ title, description, active, disabled, onClick }: { title: string; description: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={clsx(
        'rounded-xl border p-3 text-left transition',
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <p className="font-medium">{title}</p>
      <p className={clsx('mt-2 text-sm', active ? 'text-slate-300' : 'text-slate-500')}>{description}</p>
    </button>
  );
}
