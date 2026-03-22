import { useState, type FormEvent } from 'react';
import type { VisitCreate, VisitRead, ClientRead, DoctorRead, WorkerRead, ServiceRead, VisitStatus } from '../../types/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { toLocalDatetimeInput, toISOFromInput, formatCurrency } from '../../utils/formatters';

interface VisitFormProps {
  initialValues?: Partial<VisitRead>;
  clients: ClientRead[];
  doctors: DoctorRead[];
  workers: WorkerRead[];
  services: ServiceRead[];
  onSubmit: (data: VisitCreate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUSES: { value: VisitStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export function VisitForm({ initialValues = {}, clients, doctors, workers, services, onSubmit, onCancel, loading }: VisitFormProps) {
  const [clientId, setClientId] = useState<number | ''>(initialValues.client_id ?? '');
  const [date, setDate] = useState(initialValues.date ? toLocalDatetimeInput(initialValues.date) : '');
  const [doctorIds, setDoctorIds] = useState<number[]>(initialValues.doctors?.map(d => d.id) ?? []);
  const [workerIds, setWorkerIds] = useState<number[]>(initialValues.workers?.map(w => w.id) ?? []);
  const [serviceIds, setServiceIds] = useState<number[]>(initialValues.services?.map(s => s.id) ?? []);
  const [comments, setComments] = useState(initialValues.comments ?? '');
  const [status, setStatus] = useState<VisitStatus>(initialValues.status ?? 'scheduled');
  const [error, setError] = useState('');

  const calculatedPrice = services
    .filter(s => serviceIds.includes(s.id))
    .reduce((sum, s) => sum + parseFloat(s.price), 0)
    .toFixed(2);

  const toggleId = (list: number[], setList: (v: number[]) => void, id: number) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!clientId || !date) {
      setError('Client and date are required.');
      return;
    }
    try {
      await onSubmit({
        client_id: clientId as number,
        date: toISOFromInput(date),
        doctor_ids: doctorIds,
        worker_ids: workerIds,
        service_ids: serviceIds,
        comments: comments.trim() || null,
        status,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Client */}
      <Select label="Patient" icon="person" value={clientId} onChange={e => setClientId(Number(e.target.value))} required>
        <option value="">Select patient…</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name} {c.surname}</option>
        ))}
      </Select>

      {/* Date & time */}
      <Input label="Date & Time" icon="calendar_today" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />

      {/* Services multi-select pills */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Services</p>
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleId(serviceIds, setServiceIds, s.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                serviceIds.includes(s.id)
                  ? 'bg-tertiary text-on-tertiary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {s.name} — {formatCurrency(s.price)}
            </button>
          ))}
          {services.length === 0 && <p className="text-sm text-on-surface-variant">No services defined yet.</p>}
        </div>
        {serviceIds.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-on-surface">
            Total: {formatCurrency(calculatedPrice)}
          </p>
        )}
      </div>

      {/* Doctor multi-select pills */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Doctors</p>
        <div className="flex flex-wrap gap-2">
          {doctors.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleId(doctorIds, setDoctorIds, d.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                doctorIds.includes(d.id)
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {d.name} {d.surname}
            </button>
          ))}
          {doctors.length === 0 && <p className="text-sm text-on-surface-variant">No doctors available.</p>}
        </div>
      </div>

      {/* Worker multi-select pills */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Staff</p>
        <div className="flex flex-wrap gap-2">
          {workers.map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => toggleId(workerIds, setWorkerIds, w.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                workerIds.includes(w.id)
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {w.name} {w.surname}
            </button>
          ))}
          {workers.length === 0 && <p className="text-sm text-on-surface-variant">No staff available.</p>}
        </div>
      </div>

      {/* Comments & Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Comments</label>
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={2}
          placeholder="Additional notes…"
          className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-on-surface placeholder:text-outline focus:ring-0 focus:bg-surface-container-lowest transition-all outline-none resize-none"
        />
      </div>

      <Select label="Status" icon="flag" value={status} onChange={e => setStatus(e.target.value as VisitStatus)}>
        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </Select>

      {error && <p className="text-sm text-error bg-error-container/30 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Visit</Button>
      </div>
    </form>
  );
}
