import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>}
        <div className="relative group">
          {icon && (
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl select-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full bg-surface-container-low border-none rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 text-on-surface placeholder:text-outline focus:ring-0 focus:bg-surface-container-lowest transition-all outline-none ${className}`}
            {...props}
          />
          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-focus-within:w-full transition-all duration-300 rounded-full" />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
