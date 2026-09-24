import { CheckCircle2, Clock3, RotateCcw, XCircle } from 'lucide-react';

export type SuggestionStatus = 'Pending' | 'Approved' | 'Rejected' | 'ChangesRequested';

const statusDetails = {
  Pending: { label: 'Pending', icon: Clock3, className: 'border-warning-ink/25 bg-warning-surface text-warning-ink' },
  Approved: { label: 'Approved', icon: CheckCircle2, className: 'border-accent/25 bg-success-surface text-accent' },
  Rejected: { label: 'Rejected', icon: XCircle, className: 'border-error-ink/25 bg-error-surface text-error-ink' },
  ChangesRequested: { label: 'Revision Needed', icon: RotateCcw, className: 'border-warning-ink/25 bg-warning-surface text-warning-ink' },
} as const;

export default function SuggestionStatusBadge({ status }: { status: SuggestionStatus }) {
  const { label, icon: Icon, className } = statusDetails[status];

  return (
    <span className={`inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
