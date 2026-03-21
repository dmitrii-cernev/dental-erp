import type { VisitStatus } from '../../types/api';
import { statusLabel } from '../../utils/formatters';

const statusClasses: Record<VisitStatus, string> = {
  scheduled: 'bg-tertiary-container text-on-tertiary-container',
  completed: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
  no_show: 'bg-surface-container-high text-on-surface-variant',
};

export function StatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span className={`${statusClasses[status]} rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tighter`}>
      {statusLabel(status)}
    </span>
  );
}
