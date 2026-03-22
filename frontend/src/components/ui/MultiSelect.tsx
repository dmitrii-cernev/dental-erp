import { useState, useRef, useEffect } from 'react';

interface Option {
  value: number;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  icon?: string;
  options: Option[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, icon, options, value, onChange, placeholder = 'Select…' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  const remove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(x => x !== id));
  };

  const selectedLabels = options.filter(o => value.includes(o.value));
  const displayText = value.length === 0
    ? placeholder
    : `${value.length} selected`;

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && (
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative group">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl select-none pointer-events-none z-10">
            {icon}
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full bg-surface-container-low border-none rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-10 text-left text-on-surface focus:ring-0 focus:bg-surface-container-lowest transition-all outline-none ${value.length === 0 ? 'text-outline' : ''}`}
        >
          {displayText}
        </button>

        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xl transition-transform duration-200"
          style={{ transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)` }}>
          expand_more
        </span>

        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-focus-within:w-full transition-all duration-300 rounded-full" />

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-surface-container rounded-xl shadow-lg overflow-hidden border border-outline-variant">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.length === 0 && (
                <p className="px-4 py-2 text-sm text-on-surface-variant">No options available.</p>
              )}
              {options.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-on-surface">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {selectedLabels.map(opt => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-medium"
            >
              {opt.label}
              <button
                type="button"
                onClick={e => remove(opt.value, e)}
                className="material-symbols-outlined text-base leading-none hover:text-error transition-colors"
                style={{ fontSize: '14px' }}
              >
                close
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
