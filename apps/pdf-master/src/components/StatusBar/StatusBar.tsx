import type { JobState } from '@/domain/types';

interface StatusBarProps {
  documentCount: number;
  pageCount: number;
  selectedCount: number;
  activeDocumentName?: string;
  jobs: Record<string, JobState>;
}

export function StatusBar({ documentCount, pageCount, selectedCount, activeDocumentName, jobs }: StatusBarProps) {
  const visibleJobs = Object.entries(jobs).filter(([, job]) => job.status !== 'idle');

  return (
    <footer className="border-t border-[var(--pm-border)] bg-[color:var(--pm-shell)]/96 px-3 py-2 backdrop-blur-sm sm:px-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <StatusItem label="Documents" value={String(documentCount)} />
        <StatusItem label="Pages" value={String(pageCount)} />
        <StatusItem label="Selected" value={String(selectedCount)} />
        {activeDocumentName ? <StatusItem label="Active" value={activeDocumentName} truncate /> : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {visibleJobs.length ? (
            visibleJobs.map(([kind, job]) => (
              <div key={kind} className="flex min-w-[180px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5">
                <span className="font-medium capitalize text-slate-700">{kind}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[color:var(--pm-accent)] transition-all" style={{ width: `${Math.max(6, job.progress)}%` }} />
                </div>
                <span className="text-slate-500">{job.progress}%</span>
              </div>
            ))
          ) : (
            <span className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-500">Ready</span>
          )}
        </div>
      </div>
    </footer>
  );
}

function StatusItem({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5">
      <span className="font-medium text-slate-700">{label}</span>
      <span className={truncate ? 'max-w-[180px] truncate text-slate-500' : 'text-slate-500'}>{value}</span>
    </div>
  );
}
