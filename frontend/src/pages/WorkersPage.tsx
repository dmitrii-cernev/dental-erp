import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '../api/workers';
import type { WorkerRead, PersonBase } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PersonForm } from '../components/forms/PersonForm';
import { formatDate, personInitials } from '../utils/formatters';

export function WorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<WorkerRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkerRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => getWorkers().then(setWorkers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (w: WorkerRead) => { setEditing(w); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: PersonBase) => {
    setSaving(true);
    try {
      if (editing) await updateWorker(editing.id, data);
      else await createWorker(data);
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
      await deleteWorker(deleteTarget.id);
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
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">Staff / Workers</h2>
          <p className="text-on-surface-variant mt-1">{workers.length} registered staff</p>
        </div>
        <Button onClick={openAdd}>
          <span className="material-symbols-outlined text-base">person_add</span>
          Add Staff
        </Button>
      </div>

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
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Staff Member</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Contact</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Added</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Prices</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-on-surface-variant">No staff found.</td></tr>
              )}
              {workers.map(w => (
                <tr key={w.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-sm font-bold shrink-0">
                        {personInitials(w.name, w.surname)}
                      </div>
                      <div
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/workers/${w.id}`)}
                      >
                        <p className="font-semibold text-on-surface">{w.name} {w.surname}</p>
                        <p className="text-xs text-on-surface-variant">#{w.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-on-surface">{w.phone || '—'}</p>
                    <p className="text-xs text-on-surface-variant">{w.email || '—'}</p>
                  </td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">{formatDate(w.created_at)}</td>
                  <td className="px-8 py-4">
                    <button
                      onClick={() => navigate(`/workers/${w.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-xs font-semibold hover:bg-secondary-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">payments</span>
                      {w.prices_count ?? 0}
                    </button>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/workers/${w.id}`)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary" title="Price list">
                        <span className="material-symbols-outlined text-base">paid</span>
                      </button>
                      <button onClick={() => openEdit(w)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(w)} className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error">
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Staff' : 'Add Staff'}>
        <PersonForm initialValues={editing ?? {}} onSubmit={handleSubmit} onCancel={closeModal} loading={saving} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Staff"
        message={`Delete ${deleteTarget?.name} ${deleteTarget?.surname}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
