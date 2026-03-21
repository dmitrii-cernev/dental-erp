import { useState, type FormEvent } from 'react';
import type { PersonBase } from '../../types/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface PersonFormProps {
  initialValues?: Partial<PersonBase>;
  onSubmit: (data: PersonBase) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function PersonForm({ initialValues = {}, onSubmit, onCancel, loading }: PersonFormProps) {
  const [form, setForm] = useState<PersonBase>({
    name: initialValues.name ?? '',
    surname: initialValues.surname ?? '',
    phone: initialValues.phone ?? '',
    email: initialValues.email ?? '',
  });
  const [error, setError] = useState('');

  const set = (key: keyof PersonBase) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
