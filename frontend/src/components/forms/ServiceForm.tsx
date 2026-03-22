import { useState, type FormEvent } from 'react';
import type { ServiceCreate, ServiceRead } from '../../types/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ServiceFormProps {
  initialValues?: Partial<ServiceRead>;
  onSubmit: (data: ServiceCreate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceForm({ initialValues = {}, onSubmit, onCancel, loading }: ServiceFormProps) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [price, setPrice] = useState(initialValues.price ?? '0.00');
  const [steps, setSteps] = useState<string[]>(initialValues.steps ?? []);
  const [error, setError] = useState('');

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, value: string) => {
    const next = [...steps];
    next[i] = value;
    setSteps(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        price,
        steps: steps.filter(s => s.trim()),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Service Name" icon="label" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Cleaning" />
      <Input label="Price" icon="payments" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} />

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Steps</p>
          <button
            type="button"
            onClick={addStep}
            className="text-xs text-primary font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add step
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant w-5 text-right shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                placeholder={`Step ${i + 1}`}
                className="flex-1 bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm text-on-surface placeholder:text-outline focus:ring-0 focus:bg-surface-container-lowest outline-none"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="w-8 h-8 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          {steps.length === 0 && (
            <p className="text-sm text-on-surface-variant">No steps defined yet.</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-error bg-error-container/30 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Service</Button>
      </div>
    </form>
  );
}
