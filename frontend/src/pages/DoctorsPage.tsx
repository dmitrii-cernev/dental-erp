import { useEffect, useState } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../api/doctors';
import type { DoctorRead, PersonBase } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PersonForm } from '../components/forms/PersonForm';
import { formatDate, personInitials } from '../utils/formatters';

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => getDoctors().then(setDoctors).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (d: DoctorRead) => { setEditing(d); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: PersonBase) => {
    setSaving(true);
    try {
      if (editing) await updateDoctor(editing.id, data);
      else await createDoctor(data);
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
      await deleteDoctor(deleteTarget.id);
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
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">Doctors</h2>
          <p className="text-on-surface-variant mt-1">{doctors.length} registered doctors</p>
        </div>
        <Button onClick={openAdd}>
          <span className="material-symbols-outlined text-base">person_add</span>
          Add Doctor
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
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Doctor</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Contact</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Added</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-on-surface-variant">No doctors found.</td></tr>
              )}
              {doctors.map(d => (
                <tr key={d.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-sm font-bold shrink-0">
                        {personInitials(d.name, d.surname)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">Dr. {d.name} {d.surname}</p>
                        <p className="text-xs text-on-surface-variant">#{d.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-on-surface">{d.phone || '—'}</p>
                    <p className="text-xs text-on-surface-variant">{d.email || '—'}</p>
                  </td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">{formatDate(d.created_at)}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(d)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(d)} className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error">
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Doctor' : 'Add Doctor'}>
        <PersonForm initialValues={editing ?? {}} onSubmit={handleSubmit} onCancel={closeModal} loading={saving} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Doctor"
        message={`Delete Dr. ${deleteTarget?.name} ${deleteTarget?.surname}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
