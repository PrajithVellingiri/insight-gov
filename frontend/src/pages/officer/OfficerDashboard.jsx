import { useAuth } from '@/context/AuthContext';
import { useActivePetitions } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import { AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function OfficerDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('officer.dashboard', 'Officer Dashboard'));
  const { user } = useAuth();
  // useActivePetitions calls /petitions/active which applies the 2-day retention
  // rule server-side: finalized petitions (resolved/rejected/duplicate) older than
  // 2 days are excluded from this response.
  const { data: petitions = [], isLoading } = useActivePetitions();

  const statusWeight = { pending: 2, analysed: 2, under_review: 2, resolved: 0, rejected: 0, duplicate: 0 };
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1, undefined: 0 };
  
  const sortedPetitions = [...petitions].sort((a, b) => {
    const sA = statusWeight[a.status] ?? 0;
    const sB = statusWeight[b.status] ?? 0;
    if (sA !== sB) return sB - sA;

    const pA = a.priority || a.ai_analysis?.priority;
    const pB = b.priority || b.ai_analysis?.priority;
    return priorityWeight[pB] - priorityWeight[pA];
  });

  const pending = petitions.filter((p) => p.status === 'analysed' || p.status === 'under_review');
  const critical = petitions.filter((p) => p.status !== 'resolved' && (p.priority === 'critical' || p.ai_analysis?.priority === 'critical'));
  // Recently finalized petitions still in the dashboard due to the 2-day rule
  const recentlyFinalized = petitions.filter((p) => ['resolved', 'rejected', 'duplicate'].includes(p.status));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('officer.welcome', 'Officer Dashboard')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('common.department', 'Department')}: {user?.department_name || t('common.unassigned', 'Unassigned')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={20} /></div>
          <div><p className="text-2xl font-bold text-foreground">{pending.length}</p><p className="text-sm text-muted-foreground">{t('officer.pending_review', 'Pending Review')}</p></div>
        </div>
        <div className="stat-card border-destructive/20 bg-destructive/5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertTriangle size={20} /></div>
          <div><p className="text-2xl font-bold text-destructive">{critical.length}</p><p className="text-sm text-destructive font-medium">{t('priority.critical', 'Critical Alerts')}</p></div>
        </div>
        <div className="stat-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><CheckCircle size={20} /></div>
          <div><p className="text-2xl font-bold text-foreground">{recentlyFinalized.length}</p><p className="text-sm text-muted-foreground">Recently Closed</p></div>
        </div>
      </div>

      {/* Queue Table */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('officer.petition_queue', 'Department Queue')}</h2>
        <PetitionTable petitions={sortedPetitions} loading={isLoading} role="officer" />
      </div>
    </div>
  );
}
