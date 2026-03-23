import { useState, type FormEvent } from 'react';
import type { VisitCreate, VisitRead, ClientRead, DoctorRead, WorkerRead, ServiceRead, VisitStatus, VisitServiceItemInput } from '../../types/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
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
  const [serviceItems, setServiceItems] = useState<VisitServiceItemInput[]>(
    initialValues.service_items?.map(item => ({ service_id: item.service_id, quantity: item.quantity })) ?? []
  );
  const [comments, setComments] = useState(initialValues.comments ?? '');
  const [status, setStatus] = useState<VisitStatus>(initialValues.status ?? 'scheduled');
  const [error, setError] = useState('');

  // When MultiSelect changes, preserve existing quantities for services that remain selected
  const handleServiceChange = (newIds: number[]) => {
    setServiceItems(prev => {
      const prevMap = new Map(prev.map(item => [item.service_id, item.quantity]));
      return newIds.map(id => ({ service_id: id, quantity: prevMap.get(id) ?? 1 }));
    });
  };

  const updateQty = (serviceId: number, delta: number) => {
    setServiceItems(prev =>
      prev.map(item =>
        item.service_id === serviceId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const calculatedPrice = serviceItems
    .reduce((sum, item) => {
      const svc = services.find(s => s.id === item.service_id);
      return sum + (svc ? parseFloat(svc.price) * item.quantity : 0);
    }, 0)
    .toFixed(2);

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
        service_items: serviceItems,
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

      {/* Services multi-select + quantity steppers */}
      <div>
        <MultiSelect
          label="Services"
          icon="medical_services"
          options={services.map(s => ({ value: s.id, label: `${s.name} — ${formatCurrency(s.price)}` }))}
          value={serviceItems.map(item => item.service_id)}
          onChange={handleServiceChange}
          placeholder="Select services…"
        />
        {serviceItems.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {serviceItems.map(item => {
              const svc = services.find(s => s.id === item.service_id);
              if (!svc) return null;
              return (
                <div key={item.service_id} className="flex items-center justify-between px-3 py-2 bg-surface-container-low rounded-xl">
                  <span className="text-sm text-on-surface">{svc.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.service_id, -1)}
                      className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="text-sm font-semibold text-on-surface w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.service_id, 1)}
                      className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                    <span className="text-xs text-on-surface-variant w-20 text-right">
                      {formatCurrency(String((item.quantity * parseFloat(svc.price)).toFixed(2)))}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="mt-1 text-sm font-semibold text-on-surface text-right pr-1">
              Total: {formatCurrency(calculatedPrice)}
            </p>
          </div>
        )}
      </div>

      {/* Doctor multi-select dropdown */}
      <MultiSelect
        label="Doctors"
        icon="stethoscope"
        options={doctors.map(d => ({ value: d.id, label: `${d.name} ${d.surname}` }))}
        value={doctorIds}
        onChange={setDoctorIds}
        placeholder="Select doctors…"
      />

      {/* Worker multi-select dropdown */}
      <MultiSelect
        label="Staff"
        icon="badge"
        options={workers.map(w => ({ value: w.id, label: `${w.name} ${w.surname}` }))}
        value={workerIds}
        onChange={setWorkerIds}
        placeholder="Select staff…"
      />

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
