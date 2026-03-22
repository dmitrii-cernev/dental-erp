import { useEffect, useState } from 'react';
import { getServices, createService, updateService, deleteService } from '../api/services';
import type { ServiceRead, ServiceCreate } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ServiceForm } from '../components/forms/ServiceForm';
import { formatDate, formatCurrency } from '../utils/formatters';

export function ServicesPage() {
  const [services, setServices] = useState<ServiceRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => getServices().then(setServices).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: ServiceRead) => { setEditing(s); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: ServiceCreate) => {
    setSaving(true);
    try {
      if (editing) await updateService(editing.id, data);
      else await createService(data);
      await load();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteService(deleteTarget.id);
      await load();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="pt-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">Services</h2>
          <p className="text-on-surface-variant mt-1">{services.length} services in catalog</p>
        </div>
        <Button onClick={openAdd}>
          <span className="material-symbols-outlined text-base">add</span>
          Add Service
        </Button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Name</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Price</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Steps</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Created</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-on-surface-variant">No services defined yet.</td></tr>
              )}
              {services.map(s => (
                <tr key={s.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-base">medical_services</span>
                      </div>
                      <p className="font-semibold text-on-surface">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm font-semibold text-on-surface">{formatCurrency(s.price)}</td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">
                    {s.steps.length > 0 ? `${s.steps.length} step${s.steps.length !== 1 ? 's' : ''}` : '—'}
                  </td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">{formatDate(s.created_at)}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Service' : 'New Service'} maxWidth="max-w-lg">
        <ServiceForm
          initialValues={editing ?? {}}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
