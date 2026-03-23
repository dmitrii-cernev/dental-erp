import { useAuth } from '../../context/AuthContext';
import { personInitials } from '../../utils/formatters';

export function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { currentUser } = useAuth();

  return (
    <header className="fixed top-0 left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="flex justify-between items-center h-16 px-8">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant mr-1">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all"
              placeholder="Search patients, visits..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-slate-200" />
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 leading-none">{currentUser.username}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{currentUser.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                {personInitials(currentUser.username.charAt(0), currentUser.username.charAt(1))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
