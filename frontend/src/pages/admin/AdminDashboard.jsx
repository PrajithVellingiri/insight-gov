import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/api/analytics.api';
import PetitionsByCategory from '@/components/charts/PetitionsByCategory';
import PetitionsByStatus from '@/components/charts/PetitionsByStatus';
import PetitionsOverTime from '@/components/charts/PetitionsOverTime';
import StatCard from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileText, Users, Building2, CheckCircle } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('admin.welcome', 'Executive Command Overview'));

  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16 max-w-6xl mx-auto">
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
    <div className="space-y-10 pb-16 max-w-6xl mx-auto">
      {/* Executive Command Header */}
      <div className="page-header">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
            01 / EXECUTIVE REPORT
          </span>
          <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight">
            Governance Overview
          </h1>
          <p className="text-sm text-[#68716B] mt-1.5 max-w-xl leading-relaxed">
            Statewide petition intake velocity, departmental resolution performance, and active administrative workloads.
          </p>
        </div>
      </div>

      {/* Differentiated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label={t('admin.total_petitions', 'Total Applications')}
          value={stats.total_petitions || 0}
          Icon={FileText}
          variant="applications"
          description="Total citizen grievance records"
        />
        <StatCard
          label={t('status.resolved', 'Resolved Cases')}
          value={stats.resolved_petitions || 0}
          Icon={CheckCircle}
          variant="resolved"
          description="Formally concluded by departments"
        />
        <StatCard
          label={t('admin.active_officers', 'Assigned Officers')}
          value={stats.active_officers || 0}
          Icon={Users}
          variant="departments"
          description="Active ministerial triage officers"
        />
        <StatCard
          label={t('admin.departments', 'Connected Ministries')}
          value={stats.total_departments || 0}
          Icon={Building2}
          variant="pending"
          description="State departments in network"
        />
      </div>

      {/* Analytical Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E5DE] shadow-card xl:col-span-2">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E5E5DE]">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#68716B] block">
                INTAKE VELOCITY
              </span>
              <h2 className="text-sm font-bold text-[#202522]">Application Registration Trend</h2>
            </div>
            <span className="text-xs text-[#68716B] font-mono">Daily Volume</span>
          </div>
          <PetitionsOverTime data={charts?.trend || []} />
        </div>
        
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E5DE] shadow-card flex flex-col">
          <div className="mb-4 pb-3 border-b border-[#E5E5DE]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#68716B] block">
              BREAKDOWN
            </span>
            <h2 className="text-sm font-bold text-[#202522]">Resolution Status Distribution</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <PetitionsByStatus data={charts?.by_status || []} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E5DE] shadow-card">
          <div className="mb-6 pb-3 border-b border-[#E5E5DE]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#68716B] block">
              JURISDICTION VOLUME
            </span>
            <h2 className="text-sm font-bold text-[#202522]">Applications by Civic Department</h2>
          </div>
          <PetitionsByCategory data={charts?.by_category || []} />
        </div>
      </div>
    </div>
  );
}
