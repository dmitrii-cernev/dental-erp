import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/patients', icon: 'person', label: 'Patients' },
  { to: '/visits', icon: 'calendar_today', label: 'Visits' },
  { to: '/doctors', icon: 'medical_services', label: 'Doctors' },
  { to: '/workers', icon: 'badge', label: 'Workers' },
  { to: '/services', icon: 'category', label: 'Services' },
  { to: '/reports', icon: 'analytics', label: 'Reports' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-100 z-50 border-r border-slate-200/60">
      <div className="flex flex-col h-full py-6 px-4">
        {/* Logo */}
        <div className="mb-8 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-sky-900 leading-none font-headline">DentalPro</h1>
              <p className="text-[10px] font-medium text-on-surface-variant tracking-wider uppercase mt-1">Clinical ERP</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-200 text-sky-700 font-semibold opacity-90'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="mt-auto pt-6 space-y-2">
          <button
            onClick={() => navigate('/visits?new=1')}
            className="w-full bg-gradient-to-br from-primary to-primary-dim text-on-primary py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Visit</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
