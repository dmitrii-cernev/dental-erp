import { useEffect, useState } from 'react';
import { getDashboardStats } from '../api/dashboard';
import { getVisits } from '../api/visits';
import type { DashboardStats, VisitRead } from '../types/api';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/formatters';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayVisits, setTodayVisits] = useState<VisitRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      getDashboardStats(),
      getVisits({ date_from: today, date_to: today }),
    ]).then(([s, v]) => {
      setStats(s);
      setTodayVisits(v);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span></div>;
  if (!stats) return null;

  return (
    <div className="pt-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Clinical Overview</h2>
        <p className="text-on-surface-variant mt-2">Today's summary at a glance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-12 gap-6 mb-10">
        {/* Revenue card - large */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between overflow-hidden relative group shadow-sm">
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest">Monthly Revenue</p>
            <h3 className="text-4xl font-extrabold text-primary mt-2 font-headline">{formatCurrency(stats.revenue_this_month)}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">Today: <span className="font-semibold text-on-surface">{formatCurrency(stats.revenue_today)}</span></p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-9xl">payments</span>
          </div>
        </div>

        {/* Active patients */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <StatCard label="Total Patients" value={stats.total_clients} icon="group" variant="primary" />
        </div>

        {/* Quick metrics */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 grid grid-rows-2 gap-6">
          <StatCard label="Visits Today" value={stats.total_visits_today} icon="event_available" variant="tertiary" />
          <StatCard label="This Month" value={stats.total_visits_this_month} icon="calendar_month" />
        </div>
      </div>

      {/* Status breakdown + today's visits */}
      <div className="grid grid-cols-12 gap-8">
        {/* Status breakdown */}
        <div className="col-span-12 lg:col-span-4">
          <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2 font-headline">
            <span className="w-1.5 h-5 bg-primary rounded-full" />
            Visit Status
          </h3>
          <div className="space-y-3">
            {(Object.entries(stats.visits_by_status) as [string, number][]).map(([status, count]) => (
              <div key={status} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <StatusBadge status={status as import('../types/api').VisitStatus} />
                <span className="text-2xl font-bold text-on-surface font-headline">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's visits */}
        <div className="col-span-12 lg:col-span-8">
          <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2 font-headline">
            <span className="w-1.5 h-5 bg-primary rounded-full" />
            Today's Appointments
          </h3>
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
            {todayVisits.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">event_busy</span>
                No visits scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-surface-container/50">
                {todayVisits.map(visit => (
                  <div key={visit.id} className="p-5 flex items-center gap-5 hover:bg-surface-container-low transition-colors">
                    <div className="text-center min-w-[56px]">
                      <p className="text-sm font-bold text-on-surface">{new Date(visit.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="h-8 w-px bg-outline-variant/30" />
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface text-sm">Client #{visit.client_id}</p>
                      {visit.services.length > 0 && <p className="text-xs text-on-surface-variant">{visit.services.map(s => s.name).join(', ')}</p>}
                    </div>
                    <StatusBadge status={visit.status} />
                    <span className="text-sm font-semibold text-on-surface">{formatCurrency(visit.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
