import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <TopBar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="overflow-y-auto pt-16 px-4 md:px-10 pb-10 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
