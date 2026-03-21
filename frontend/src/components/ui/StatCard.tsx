interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  variant?: 'default' | 'primary' | 'tertiary';
  subtext?: string;
}

export function StatCard({ label, value, icon, variant = 'default', subtext }: StatCardProps) {
  const containerClasses = {
    default: 'bg-surface-container-lowest',
    primary: 'bg-primary text-on-primary',
    tertiary: 'bg-tertiary-container',
  };

  const labelClasses = {
    default: 'text-on-surface-variant',
    primary: 'text-primary-fixed-dim',
    tertiary: 'text-on-tertiary-container',
  };

  const valueClasses = {
    default: 'text-on-surface',
    primary: 'text-on-primary',
    tertiary: 'text-on-tertiary-container',
  };

  const iconBg = {
    default: 'bg-surface-container-low text-primary',
    primary: 'bg-primary-dim/30 text-on-primary',
    tertiary: 'bg-white/40 text-on-tertiary-container',
  };

  return (
    <div className={`${containerClasses[variant]} p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg[variant]}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider ${labelClasses[variant]}`}>{label}</p>
        <h4 className={`text-2xl font-bold font-headline ${valueClasses[variant]}`}>{value}</h4>
        {subtext && <p className={`text-xs mt-0.5 ${labelClasses[variant]}`}>{subtext}</p>}
      </div>
    </div>
  );
}
