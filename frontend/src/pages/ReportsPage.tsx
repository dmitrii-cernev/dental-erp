import { useState, useEffect } from 'react';
import { downloadReport } from '../api/reports';
import { getVisits } from '../api/visits';
import { getClients } from '../api/clients';
import { getDoctors } from '../api/doctors';
import type { VisitRead, ClientRead, DoctorRead } from '../types/api';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDateTime, formatCurrency } from '../utils/formatters';

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [clients, setClients] = useState<ClientRead[]>([]);
  const [doctors, setDoctors] = useState<DoctorRead[]>([]);
  const [preview, setPreview] = useState<VisitRead[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getClients(), getDoctors()]).then(([c, d]) => {
      setClients(c);
      setDoctors(d);
    });
  }, []);

  const buildFilters = () => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    client_id: clientId || undefined,
    doctor_id: doctorId || undefined,
  });

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError('');
    try {
      const visits = await getVisits(buildFilters() as import('../types/api').VisitFilters);
      setPreview(visits);
    } catch {
      setError('Failed to load preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadReport(buildFilters());
    } catch {
      setError('Failed to generate report.');
    } finally {
      setDownloading(false);
    }
  };

  const clientName = (id: number) => {
    const c = clients.find(c => c.id === id);
    return c ? `${c.name} ${c.surname}` : `#${id}`;
  };

  return (
    <div className="pt-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-on-surface font-headline">Reports</h2>
        <p className="text-on-surface-variant mt-1">Generate and export PDF reports.</p>
      </div>

      {/* Filter form */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 mb-8 shadow-sm">
        <h3 className="text-lg font-bold text-on-surface font-headline mb-6">Report Filters</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-surface-container-low rounded-xl border-none px-4 py-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-surface-container-low rounded-xl border-none px-4 py-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Patient</label>
            <select value={clientId} onChange={e => setClientId(e.target.value ? Number(e.target.value) : '')}
              className="bg-surface-container-low rounded-xl border-none px-4 py-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest appearance-none">
              <option value="">All Patients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.surname}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Doctor</label>
            <select value={doctorId} onChange={e => setDoctorId(e.target.value ? Number(e.target.value) : '')}
              className="bg-surface-container-low rounded-xl border-none px-4 py-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest appearance-none">
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} {d.surname}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-error mb-4">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePreview} loading={previewLoading}>
            <span className="material-symbols-outlined text-base">preview</span>
            Preview
          </Button>
          <Button onClick={handleDownload} loading={downloading}>
            <span className="material-symbols-outlined text-base">download</span>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
          <div className="px-8 py-4 border-b border-surface-container">
            <h3 className="font-bold text-on-surface">{preview.length} visits in report</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Services</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Price</th>
              </tr>
            </thead>
            <tbody>
              {preview.map(v => (
                <tr key={v.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-6 py-3 text-sm text-on-surface">{formatDateTime(v.date)}</td>
                  <td className="px-6 py-3 text-sm text-on-surface">{clientName(v.client_id)}</td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant">{v.service_items.length > 0 ? v.service_items.map(item => item.quantity > 1 ? `${item.service.name} ×${item.quantity}` : item.service.name).join(', ') : '—'}</td>
                  <td className="px-6 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-6 py-3 text-sm font-semibold text-on-surface text-right">{formatCurrency(v.price)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-surface-container bg-surface-container-low/30">
                <td colSpan={4} className="px-6 py-3 text-sm font-bold text-on-surface">Total</td>
                <td className="px-6 py-3 text-sm font-bold text-primary text-right">
                  {formatCurrency(preview.reduce((sum, v) => sum + parseFloat(v.price), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
