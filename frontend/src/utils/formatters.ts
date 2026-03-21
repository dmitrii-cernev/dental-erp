import type { VisitStatus } from '../types/api';

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function statusLabel(status: VisitStatus): string {
  const labels: Record<VisitStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return labels[status];
}

export function personInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

export function toLocalDatetimeInput(isoString: string): string {
  // Convert ISO datetime to format for <input type="datetime-local">
  return isoString.slice(0, 16);
}

export function toISOFromInput(localDatetime: string): string {
  // Convert datetime-local input value to ISO 8601 for API
  return new Date(localDatetime).toISOString().slice(0, 19);
}
