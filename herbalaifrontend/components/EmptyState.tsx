import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <section className={`empty-state ${compact ? 'empty-state-compact' : ''}`} aria-live="polite">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </section>
  );
}
