import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorker } from '../api/workers';
import { getServices } from '../api/services';
import { getWorkerPrices, upsertWorkerPrice, deleteWorkerPrice } from '../api/workerPrices';
import type { WorkerRead, ServiceRead, WorkerPriceRead } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatDate, personInitials } from '../utils/formatters';

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workerId = Number(id);

  const [worker, setWorker] = useState<WorkerRead | null>(null);
  const [prices, setPrices] = useState<WorkerPriceRead[]>([]);
  const [services, setServices] = useState<ServiceRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkerPriceRead | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceError, setPriceError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<WorkerPriceRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const [w, p, s] = await Promise.all([
      getWorker(workerId),
      getWorkerPrices(workerId),
      getServices(),
    ]);
    setWorker(w);
    setPrices(p);
    setServices(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workerId]);

  const configuredServiceIds = new Set(prices.map(p => p.service_id));

  const openAdd = () => {
    setEditingEntry(null);
    setSelectedServiceId('');
    setPriceInput('');
    setPriceError('');
    setModalOpen(true);
  };

  const openEdit = (entry: WorkerPriceRead) => {
    setEditingEntry(entry);
    setSelectedServiceId(String(entry.service_id));
    setPriceInput(entry.price);
    setPriceError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
  };

  const validatePrice = (serviceId: number, price: string): string => {
    const num = parseFloat(price);
    if (isNaN(num) || num <= 0) return 'Enter a valid price';
    const svc = services.find(s => s.id === serviceId);
    if (svc && num >= parseFloat(svc.price)) {
      return `Must be less than service price (${svc.price})`;
    }
    return '';
  };

  const handleSubmit = async () => {
    const svcId = Number(selectedServiceId);
    const err = validatePrice(svcId, priceInput);
    if (err) { setPriceError(err); return; }
    setSaving(true);
    try {
      await upsertWorkerPrice(workerId, svcId, parseFloat(priceInput).toFixed(2));
      await load();
      closeModal();
    } catch (e: any) {
      setPriceError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteWorkerPrice(workerId, deleteTarget.service_id);
      await load();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const availableServices = services.filter(
    s => !configuredServiceIds.has(s.id) || s.id === editingEntry?.service_id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
      </div>
    );
  }

  if (!worker) {
    return <div className="pt-8 max-w-7xl mx-auto text-on-surface-variant">Worker not found.</div>;
  }

  return (
    <div className="pt-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/workers')}
          className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-lg font-bold shrink-0">
          {personInitials(worker.name, worker.surname)}
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">{worker.name} {worker.surname}</h2>
          <p className="text-on-surface-variant text-sm">#{worker.id}</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm mb-8 flex gap-8">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Phone</p>
          <p className="text-on-surface">{worker.phone || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email</p>
          <p className="text-on-surface">{worker.email || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Joined</p>
          <p className="text-on-surface">{formatDate(worker.created_at)}</p>
        </div>
      </div>

      {/* Price list */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-on-surface">Price List</h3>
        <Button onClick={openAdd}>
          <span className="material-symbols-outlined text-base">add</span>
          Add Price
        </Button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
        {prices.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">No prices configured yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Service</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Service Price</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Worker Price</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(entry => {
                const isInvalid = parseFloat(entry.price) >= parseFloat(entry.service_price);
                return (
                  <tr key={entry.service_id} className={`hover:bg-surface-container-low/40 transition-colors ${isInvalid ? 'bg-error-container/10' : ''}`}>
                    <td className="px-8 py-4 text-on-surface font-medium">{entry.service_name}</td>
                    <td className="px-8 py-4 text-on-surface-variant">{entry.service_price}</td>
                    <td className="px-8 py-4">
                      <span className={isInvalid ? 'text-error font-semibold' : 'text-on-surface'}>
                        {entry.price}
                        {isInvalid && (
                          <span className="material-symbols-outlined text-sm ml-1 align-middle">warning</span>
                        )}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(entry)}
                          className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(entry)}
                          className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingEntry ? 'Edit Price' : 'Add Price'}>
        <div className="flex flex-col gap-4">
          {!editingEntry && (
            <Select
              label="Service"
              value={selectedServiceId}
              onChange={e => { setSelectedServiceId(e.target.value); setPriceError(''); }}
            >
              <option value="">Select a service…</option>
              {availableServices.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (max: {s.price})
                </option>
              ))}
            </Select>
          )}
          {editingEntry && (
            <p className="text-sm text-on-surface-variant">
              Service: <span className="font-semibold text-on-surface">{editingEntry.service_name}</span>
              {' '}(max: {editingEntry.service_price})
            </p>
          )}
          <Input
            label="Worker Price"
            type="number"
            min="0"
            step="0.01"
            value={priceInput}
            onChange={e => { setPriceInput(e.target.value); setPriceError(''); }}
            error={priceError}
            icon="payments"
          />
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-on-surface-variant hover:text-on-surface text-sm"
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              disabled={saving || (!editingEntry && !selectedServiceId) || !priceInput}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Price"
        message={`Remove price for "${deleteTarget?.service_name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
