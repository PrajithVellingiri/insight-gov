import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/api/analytics.api';
import PetitionsByCategory from '@/components/charts/PetitionsByCategory';
import PetitionsByStatus from '@/components/charts/PetitionsByStatus';
import PetitionsOverTime from '@/components/charts/PetitionsOverTime';
import StatCard from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileText, Users, Building2, CheckCircle, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('admin.welcome', 'Admin Command Center'));

  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-80 xl:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Command Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles size={13} />
              Central Government Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Executive Command Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time telemetry, model performance metrics, and cross-departmental workload distribution.
          </p>
        </div>
      </div>

      {/* 3D Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label={t('admin.total_petitions', 'Total Petitions')}
          value={stats.total_petitions || 0}
          Icon={FileText}
          color="text-blue-400 bg-blue-500/10 border-blue-500/25"
          glowColor="rgba(59, 130, 246, 0.25)"
          description="Total grievance submissions"
        />
        <StatCard
          label={t('status.resolved', 'Resolved Petitions')}
          value={stats.resolved_petitions || 0}
          Icon={CheckCircle}
          color="text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
          glowColor="rgba(16, 185, 129, 0.25)"
          description="Closed by verified officers"
        />
        <StatCard
          label={t('admin.active_officers', 'Active Officers')}
          value={stats.active_officers || 0}
          Icon={Users}
          color="text-cyan-400 bg-cyan-500/10 border-cyan-500/25"
          glowColor="rgba(6, 182, 212, 0.25)"
          description="Authorized triage personnel"
        />
        <StatCard
          label={t('admin.departments', 'State Ministries')}
          value={stats.total_departments || 0}
          Icon={Building2}
          color="text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
          glowColor="rgba(99, 102, 241, 0.25)"
          description="Registered government departments"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 xl:col-span-2 chart-wrapper">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Grievance Registration Trend</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Real-time Stream</span>
          </div>
          <PetitionsOverTime data={charts?.trend || []} />
        </div>
        
        <div className="glass-panel rounded-2xl p-6 flex flex-col chart-wrapper">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800/80">
            <div className="w-2.5 h-6 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Status Distribution</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <PetitionsByStatus data={charts?.by_status || []} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel rounded-2xl p-6 chart-wrapper">
          <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-800/80">
            <div className="w-2.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Grievances by Civic Sector</h2>
          </div>
          <PetitionsByCategory data={charts?.by_category || []} />
        </div>
      </div>
    </div>
  );
}
