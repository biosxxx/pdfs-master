import type { JobState } from '@/domain/types';

interface ProgressBarProps {
  label: string;
  job: JobState;
}

export function ProgressBar({ label, job }: ProgressBarProps) {
  if (!['running', 'queued', 'error', 'success'].includes(job.status)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-900">{label}</span>
        <span className="text-slate-500">{job.progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
          style={{ width: `${Math.max(4, job.progress)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-600">{job.message || (job.status === 'success' ? 'Completed.' : 'Working...')}</p>
    </div>
  );
}
