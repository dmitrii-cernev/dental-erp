import { useState, type FormEvent } from 'react';
import type { DoctorBase } from '../../types/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface DoctorFormProps {
  initialValues?: Partial<DoctorBase>;
  onSubmit: (data: DoctorBase) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DoctorForm({ initialValues = {}, onSubmit, onCancel, loading }: DoctorFormProps) {
  const [form, setForm] = useState<DoctorBase>({
    name: initialValues.name ?? '',
    surname: initialValues.surname ?? '',
    phone: initialValues.phone ?? '',
    email: initialValues.email ?? '',
    company: initialValues.company ?? '',
  });
  const [error, setError] = useState('');

  const set = (key: keyof DoctorBase) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.surname.trim()) {
      setError('Name and surname are required.');
      return;
    }
    try {
      await onSubmit({
        name: form.name.trim(),
        surname: form.surname.trim(),
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        company: form.company?.trim() || null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" icon="person" value={form.name} onChange={set('name')} required autoFocus />
        <Input label="Last Name" icon="badge" value={form.surname} onChange={set('surname')} required />
      </div>
      <Input label="Company / Clinic" icon="business" value={form.company ?? ''} onChange={set('company')} placeholder="e.g. City Dental Clinic" />
      <Input label="Phone" icon="phone" type="tel" value={form.phone ?? ''} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
      <Input label="Email" icon="email" type="email" value={form.email ?? ''} onChange={set('email')} placeholder="name@clinic.com" />
      {error && <p className="text-sm text-error bg-error-container/30 rounded-xl px-4 py-2">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
}
