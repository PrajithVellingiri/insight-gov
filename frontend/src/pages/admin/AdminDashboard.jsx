import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/api/analytics.api';
import PetitionsByCategory from '@/components/charts/PetitionsByCategory';
import PetitionsByStatus from '@/components/charts/PetitionsByStatus';
import PetitionsOverTime from '@/components/charts/PetitionsOverTime';
import { Skeleton } from '@/components/ui/Skeleton';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  usePageTitle('Executive Operations Overview');

  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-b border-[#DDDCD7]">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-80 xl:col-span-2 rounded" />
          <Skeleton className="h-80 rounded" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="border-b border-[#DDDCD7] pb-6">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
          EXECUTIVE COMMAND
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
          Governance Operations
        </h1>
        <p className="text-xs sm:text-sm text-[#6F6F6A] mt-1 max-w-xl leading-relaxed">
          Statewide petition intake velocity, departmental resolution performance, and active administrative workloads.
        </p>
      </div>

      {/* Typographic Metrics Banner (Thin Horizontal Rules) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-b border-[#DDDCD7]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
            TOTAL APPLICATIONS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {(stats.total_petitions || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Total citizen grievance records</p>
        </div>

        <div className="space-y-1 border-l border-[#DDDCD7] pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F05A3C]">
            RESOLVED CASES
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#F05A3C] font-mono">
            {(stats.resolved_petitions || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Concluded by departments</p>
        </div>

        <div className="space-y-1 border-l border-[#DDDCD7] pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
            ASSIGNED OFFICERS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {(stats.active_officers || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Ministerial triage personnel</p>
        </div>

        <div className="space-y-1 border-l border-[#DDDCD7] pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
            CONNECTED MINISTRIES
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {(stats.total_departments || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Administrative queues active</p>
        </div>
      </div>

      {/* Analytical Charts Section (Technology Research Report layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Intake Velocity Chart (2 cols) */}
        <div className="bg-white rounded-md p-6 border border-[#DDDCD7] shadow-card xl:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DDDCD7]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block">
                INTAKE VELOCITY
              </span>
              <h2 className="text-sm font-bold text-[#181817] uppercase tracking-wider font-mono">
                Daily Application Registration
              </h2>
            </div>
            <span className="text-xs text-[#F05A3C] font-mono font-semibold">● Live Telemetry</span>
          </div>
          <PetitionsOverTime data={charts.over_time || []} />
        </div>

        {/* Status Distribution (1 col) */}
        <div className="bg-white rounded-md p-6 border border-[#DDDCD7] shadow-card">
          <div className="mb-4 pb-3 border-b border-[#DDDCD7]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block">
              CASE STATUS
            </span>
            <h2 className="text-sm font-bold text-[#181817] uppercase tracking-wider font-mono">
              Caseload Breakdown
            </h2>
          </div>
          <PetitionsByStatus data={charts.by_status || []} />
        </div>
      </div>

      {/* Category Distribution Full Width */}
      <div className="bg-white rounded-md p-6 border border-[#DDDCD7] shadow-card">
        <div className="mb-4 pb-3 border-b border-[#DDDCD7]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F05A3C] block">
            JURISDICTION VOLUME
          </span>
          <h2 className="text-sm font-bold text-[#181817] uppercase tracking-wider font-mono">
            Department Allocation Analysis
          </h2>
        </div>
        <PetitionsByCategory data={charts.by_category || []} />
      </div>
    </div>
  );
}
