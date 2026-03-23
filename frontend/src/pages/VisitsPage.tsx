import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getVisits, createVisit, updateVisit, deleteVisit } from '../api/visits';
import { getClients } from '../api/clients';
import { getDoctors } from '../api/doctors';
import { getWorkers } from '../api/workers';
import { getServices } from '../api/services';
import type { VisitRead, VisitCreate, ClientRead, DoctorRead, WorkerRead, ServiceRead, VisitStatus } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { VisitForm } from '../components/forms/VisitForm';
import { formatDateTime, formatCurrency } from '../utils/formatters';

const STATUSES: { value: '' | VisitStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export function VisitsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [visits, setVisits] = useState<VisitRead[]>([]);
  const [clients, setClients] = useState<ClientRead[]>([]);
  const [doctors, setDoctors] = useState<DoctorRead[]>([]);
  const [workers, setWorkers] = useState<WorkerRead[]>([]);
  const [services, setServices] = useState<ServiceRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VisitRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisitRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | VisitStatus>('');
  const [clientFilter, setClientFilter] = useState<number | ''>('');

  const loadAll = async () => {
    setLoading(true);
    const filters: Record<string, string | number | undefined> = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (statusFilter) filters.status = statusFilter;
    if (clientFilter) filters.client_id = clientFilter as number;

    try {
      const [v, c, d, w, s] = await Promise.all([
        getVisits(filters as import('../types/api').VisitFilters),
        getClients(),
        getDoctors(),
        getWorkers(),
        getServices(),
      ]);
      setVisits(v);
      setClients(c);
      setDoctors(d);
      setWorkers(w);
      setServices(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setModalOpen(true);
      navigate('/visits', { replace: true });
    }
  }, [searchParams]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (v: VisitRead) => { setEditing(v); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: VisitCreate) => {
    setSaving(true);
    try {
      if (editing) await updateVisit(editing.id, data);
      else await createVisit(data);
      await loadAll();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteVisit(deleteTarget.id);
      await loadAll();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const clientName = (id: number) => {
    const c = clients.find(c => c.id === id);
    return c ? `${c.name} ${c.surname}` : `#${id}`;
  };

  return (
    <div className="pt-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">Visits</h2>
          <p className="text-on-surface-variant mt-1">{visits.length} visits</p>
        </div>
        <Button onClick={openAdd}>
          <span className="material-symbols-outlined text-base">add</span>
          New Visit
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-surface-container-low rounded-xl border-none px-4 py-2.5 text-sm text-on-surface outline-none focus:bg-surface-container-lowest" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-surface-container-low rounded-xl border-none px-4 py-2.5 text-sm text-on-surface outline-none focus:bg-surface-container-lowest" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | VisitStatus)}
            className="bg-surface-container-low rounded-xl border-none px-4 py-2.5 text-sm text-on-surface outline-none focus:bg-surface-container-lowest appearance-none pr-8">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Patient</label>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value ? Number(e.target.value) : '')}
            className="bg-surface-container-low rounded-xl border-none px-4 py-2.5 text-sm text-on-surface outline-none focus:bg-surface-container-lowest appearance-none pr-8">
            <option value="">All Patients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.surname}</option>)}
          </select>
        </div>
        <Button variant="secondary" onClick={loadAll} size="md">
          <span className="material-symbols-outlined text-base">filter_list</span>
          Apply
        </Button>
        <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setClientFilter(''); }}
          className="text-sm text-on-surface-variant hover:text-primary transition-colors">
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Date</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Patient</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Doctors</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Services</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Status</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Price</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-on-surface-variant">No visits found.</td></tr>
              )}
              {visits.map(v => (
                <tr key={v.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-8 py-4 text-sm text-on-surface">{formatDateTime(v.date)}</td>
                  <td className="px-8 py-4 text-sm font-medium text-on-surface">{clientName(v.client_id)}</td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">
                    {v.doctors.length > 0 ? v.doctors.map(d => `Dr. ${d.surname}`).join(', ') : '—'}
                  </td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">
                    {v.service_items.length > 0 ? v.service_items.map(item => item.quantity > 1 ? `${item.service.name} ×${item.quantity}` : item.service.name).join(', ') : '—'}
                  </td>
                  <td className="px-8 py-4"><StatusBadge status={v.status} /></td>
                  <td className="px-8 py-4 text-sm font-semibold text-on-surface">{formatCurrency(v.price)}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(v)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(v)} className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Visit' : 'New Visit'} maxWidth="max-w-2xl">
        <VisitForm
          initialValues={editing ?? {}}
          clients={clients}
          doctors={doctors}
          workers={workers}
          services={services}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Visit"
        message="Are you sure you want to delete this visit? This cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
}
