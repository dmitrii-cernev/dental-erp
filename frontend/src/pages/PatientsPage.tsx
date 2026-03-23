import { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../api/clients';
import type { ClientRead, PersonBase } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PersonForm } from '../components/forms/PersonForm';
import { formatDate, personInitials } from '../utils/formatters';

export function PatientsPage() {
  const [clients, setClients] = useState<ClientRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => getClients().then(setClients).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    `${c.name} ${c.surname} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: ClientRead) => { setEditing(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: PersonBase) => {
    setSaving(true);
    try {
      if (editing) await updateClient(editing.id, data);
      else await createClient(data);
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
      await deleteClient(deleteTarget.id);
      await load();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="pt-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">Patients</h2>
          <p className="text-on-surface-variant mt-1">{clients.length} total patients</p>
        </div>
        <Button onClick={openAdd}>
          <span className="material-symbols-outlined text-base">person_add</span>
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
        <input
          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-2.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline focus:ring-0 focus:border-primary outline-none transition-all"
          placeholder="Search patients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Patient</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Contact</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Since</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-on-surface-variant">No patients found.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-bold shrink-0">
                        {personInitials(c.name, c.surname)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{c.name} {c.surname}</p>
                        <p className="text-xs text-on-surface-variant">#{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-on-surface">{c.phone || '—'}</p>
                    <p className="text-xs text-on-surface-variant">{c.email || '—'}</p>
                  </td>
                  <td className="px-8 py-4 text-sm text-on-surface-variant">{formatDate(c.created_at)}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error">
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Patient' : 'Add Patient'}>
        <PersonForm initialValues={editing ?? {}} onSubmit={handleSubmit} onCancel={closeModal} loading={saving} />
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deleteTarget?.name} ${deleteTarget?.surname}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
