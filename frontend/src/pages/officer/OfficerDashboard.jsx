import { useAuth } from '@/context/AuthContext';
import { useActivePetitions } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import StatCard from '@/components/ui/StatCard';
import { AlertTriangle, FileText, CheckCircle, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function OfficerDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('officer.dashboard', 'Officer Queue Command'));
  const { user } = useAuth();
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
  const recentlyFinalized = petitions.filter((p) => ['resolved', 'rejected', 'duplicate'].includes(p.status));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles size={13} />
              Operational Triage Command
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <Building2 size={10} />
              {user?.department_name || t('common.unassigned', 'Unassigned Ministry')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {t('officer.welcome', 'Department Grievance Queue')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review AI categorisation, examine vector duplicate matches, and issue formal administrative determinations.
          </p>
        </div>
      </div>

      {/* 3D Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label={t('officer.pending_review', 'Pending Review')}
          value={pending.length}
          Icon={FileText}
          color="text-blue-400 bg-blue-500/10 border-blue-500/25"
          glowColor="rgba(59, 130, 246, 0.25)"
          description="Assigned petitions requiring officer action"
        />
        <StatCard
          label={t('priority.critical', 'Critical Escalations')}
          value={critical.length}
          Icon={AlertTriangle}
          color="text-rose-400 bg-rose-500/15 border-rose-500/30"
          glowColor="rgba(244, 63, 94, 0.3)"
          trend="Immediate SLA"
          trendType="negative"
          description="High severity or public safety issues"
        />
        <StatCard
          label="Recently Finalized"
          value={recentlyFinalized.length}
          Icon={CheckCircle}
          color="text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
          glowColor="rgba(16, 185, 129, 0.25)"
          description="Closed within active 48-hour retention"
        />
      </div>

      {/* Queue Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 tracking-tight">
            <ShieldCheck size={18} className="text-blue-400" />
            {t('officer.petition_queue', 'Prioritised Ministry Queue')}
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {sortedPetitions.length} Active Records
          </span>
        </div>
        <PetitionTable petitions={sortedPetitions} role="officer" />
      </div>
    </div>
  );
}
