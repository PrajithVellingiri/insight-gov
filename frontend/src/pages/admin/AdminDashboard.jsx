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
    <div className="space-y-8">
      <div>
        <div className="page-header mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('admin.platform_analytics', 'Platform Analytics')}</h1>
            <p className="text-muted-foreground text-sm mt-1">Platform-wide overview and AI performance.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: t('admin.total_petitions', 'Total Petitions'), value: stats.total_petitions || 0, Icon: FileText, color: 'text-primary bg-primary/10' },
            { label: t('status.resolved', 'Resolved'), value: stats.resolved_petitions || 0, Icon: FileText, color: 'text-accent bg-accent/10' },
            { label: t('admin.active_officers', 'Active Officers'), value: stats.active_officers || 0, Icon: Users, color: 'text-purple-600 bg-purple-500/10' },
            { label: t('admin.departments', 'Departments'), value: stats.total_departments || 0, Icon: Building2, color: 'text-muted-foreground bg-secondary' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="stat-card">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card lg:col-span-2">
            <h2 className="section-title">Submission Trend (30 Days)</h2>
            <PetitionsOverTime data={charts?.trend || []} />
          </div>
          <div className="card">
            <h2 className="section-title">Status Distribution</h2>
            <PetitionsByStatus data={charts?.by_status || []} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card lg:col-span-2">
            <h2 className="section-title">Petitions by Category</h2>
            <PetitionsByCategory data={charts?.by_category || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
