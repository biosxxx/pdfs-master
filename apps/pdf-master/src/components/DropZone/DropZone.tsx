import { useRef, useState } from 'react';
import clsx from 'clsx';

interface DropZoneProps {
  disabled?: boolean;
  compact?: boolean;
  onFiles: (files: File[]) => void;
}

export function DropZone({ disabled, compact, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length || disabled) {
      return;
    }
    onFiles(Array.from(fileList));
  };

  return (
    <section className={clsx('rounded-xl border border-dashed transition', compact ? 'p-3' : 'p-4', isOver ? 'border-[color:var(--pm-accent-strong)] bg-[color:var(--pm-accent-soft)]' : 'border-slate-300 bg-white')}>
      <div
        className={clsx('rounded-lg border border-dashed px-4 text-center transition', compact ? 'py-6' : 'py-8', isOver ? 'border-[color:var(--pm-accent-strong)] bg-white/70' : 'border-slate-300 bg-slate-50/70', disabled && 'cursor-not-allowed opacity-60')}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsOver(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsOver(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsOver(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
          PDF
        </div>
        <h3 className={clsx('font-semibold text-slate-900', compact ? 'mt-3 text-base' : 'mt-4 text-lg')}>
          Drop PDFs here or choose files
        </h3>
        <p className={clsx('mx-auto mt-2 max-w-xl text-slate-500', compact ? 'text-sm leading-6' : 'text-sm leading-6')}>
          Import one or many PDFs, keep all processing local, then reorder and export directly from the workspace.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-[color:var(--pm-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[color:var(--pm-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Select PDF files
          </button>
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Client-side only</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>
    </section>
  );
}
