import { apiFetchBlob } from './client';
import type { ReportFilters } from '../types/api';

export async function downloadReport(filters: ReportFilters): Promise<void> {
  const blob = await apiFetchBlob('/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
