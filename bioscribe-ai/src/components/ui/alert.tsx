import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn('relative rounded-lg border border-slate-200 bg-white p-4 text-sm [&>svg]:mb-2', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('leading-relaxed text-slate-600', className)} {...props} />;
}
