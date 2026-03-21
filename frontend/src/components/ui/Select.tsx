import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>}
        <div className="relative group">
          {icon && (
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl select-none pointer-events-none">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            className={`w-full bg-surface-container-low border-none rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-10 text-on-surface focus:ring-0 focus:bg-surface-container-lowest transition-all outline-none appearance-none ${className}`}
            {...props}
          >
            {children}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xl">expand_more</span>
          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-focus-within:w-full transition-all duration-300 rounded-full" />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
