import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/api/analytics.api';
import PetitionsByCategory from '@/components/charts/PetitionsByCategory';
import PetitionsByStatus from '@/components/charts/PetitionsByStatus';
import PetitionsOverTime from '@/components/charts/PetitionsOverTime';
import { FileText, Users, Building2, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Platform-wide overview and AI performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Petitions', value: stats.total_petitions || 0, Icon: FileText, color: 'text-primary-600 bg-primary-50' },
          { label: 'Resolved', value: stats.resolved_petitions || 0, Icon: FileText, color: 'text-accent-600 bg-accent-50' },
          { label: 'Active Officers', value: stats.active_officers || 0, Icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Departments', value: stats.total_departments || 0, Icon: Building2, color: 'text-slate-600 bg-slate-100' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
  );
}
