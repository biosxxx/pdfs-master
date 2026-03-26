import clsx from 'clsx';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  children?: ReactNode;
  align?: 'start' | 'center';
}

export function EmptyState({ title, description, children, align = 'start' }: EmptyStateProps) {
  return (
    <div className={clsx(
      'rounded-xl border border-slate-200 bg-white',
      align === 'center' ? 'p-5 md:p-6' : 'p-4',
    )}>
      <div className={clsx(align === 'center' && 'mx-auto max-w-6xl text-center')}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        <h3 className={clsx('font-semibold text-slate-900', align === 'center' ? 'mt-3 text-lg md:text-xl' : 'mt-2 text-base')}>
          {title}
        </h3>
        <p className={clsx(
          'text-sm leading-6 text-slate-500',
          align === 'center' ? 'mx-auto mt-3 max-w-3xl' : 'mt-2 max-w-2xl',
        )}>
          {description}
        </p>
        {children ? <div className={clsx(align === 'center' ? 'mt-6' : 'mt-4')}>{children}</div> : null}
      </div>
    </div>
  );
}
