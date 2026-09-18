import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/api/analytics.api';
import PetitionsByCategory from '@/components/charts/PetitionsByCategory';
import PetitionsByStatus from '@/components/charts/PetitionsByStatus';
import PetitionsOverTime from '@/components/charts/PetitionsOverTime';
import { FileText, Users, Building2, Loader2 } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('admin.welcome', 'Admin Dashboard'));

  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-8 pb-10">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time analytics and AI performance metrics.</p>
          </div>
        </div>

        {/* Metric Cards - Staggered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: t('admin.total_petitions', 'Total Petitions'), value: stats.total_petitions || 0, Icon: FileText, delay: 'delay-100' },
            { label: t('status.resolved', 'Resolved Petitions'), value: stats.resolved_petitions || 0, Icon: FileText, delay: 'delay-200' },
            { label: t('admin.active_officers', 'Active Officers'), value: stats.active_officers || 0, Icon: Users, delay: 'delay-300' },
            { label: t('admin.departments', 'Gov Departments'), value: stats.total_departments || 0, Icon: Building2, delay: 'delay-400' },
          ].map(({ label, value, Icon, delay }) => (
            <div key={label} className={`card hover:-translate-y-1.5 transition-transform duration-300 animate-fade-in-up ${delay}`}>
              <div className="flex items-center justify-between mb-4 text-muted-foreground">
                <p className="text-sm font-medium uppercase tracking-wider">{label}</p>
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <Icon size={18} className="text-primary" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-foreground tracking-tight" style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="card xl:col-span-2 animate-fade-in-up delay-300 chart-wrapper">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-6 bg-primary rounded-full animate-pulse"></div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Submission Trend</h2>
            </div>
            <PetitionsOverTime data={charts?.trend || []} />
          </div>
          
          <div className="card animate-fade-in-up delay-400 chart-wrapper flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-6 bg-accent rounded-full"></div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Status Distribution</h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <PetitionsByStatus data={charts?.by_status || []} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card lg:col-span-2 animate-fade-in-up delay-500 chart-wrapper">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-6 bg-primary rounded-full"></div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Petitions by Category</h2>
            </div>
            <PetitionsByCategory data={charts?.by_category || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
