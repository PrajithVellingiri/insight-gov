import { useAuth } from '@/context/AuthContext';
import { useActivePetitions } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import StatCard from '@/components/ui/StatCard';
import { AlertTriangle, FileText, CheckCircle, Building2 } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function OfficerDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('officer.dashboard', 'Officer Queue Overview'));
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

  const pending = petitions.filter((p) => p.status === 'analysed' || p.status === 'under_review' || p.status === 'pending');
  const critical = petitions.filter((p) => p.status !== 'resolved' && (p.priority === 'critical' || p.ai_analysis?.priority === 'critical'));
  const recentlyFinalized = petitions.filter((p) => ['resolved', 'rejected', 'duplicate'].includes(p.status));

  return (
    <div className="space-y-10 pb-16 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="page-header">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
            01 / OFFICER WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight">
            Department Grievance Queue
          </h1>
          <p className="text-sm text-[#68716B] mt-1 max-w-xl leading-relaxed">
            Review triaged citizen applications, inspect geospatial cluster records, and issue administrative determinations.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5DE] bg-white text-xs text-[#202522] shadow-subtle">
          <Building2 size={14} className="text-[#315C4A]" />
          <span className="font-semibold">{user?.department_name || 'Ministry Review Queue'}</span>
        </div>
      </div>

      {/* Differentiated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Pending Review"
          value={pending.length}
          Icon={FileText}
          variant="pending"
          description="Assigned petitions requiring officer action"
        />
        <StatCard
          label="Critical Priority"
          value={critical.length}
          Icon={AlertTriangle}
          variant="pending"
          description="High severity or public safety issues"
        />
        <StatCard
          label="Recently Finalized"
          value={recentlyFinalized.length}
          Icon={CheckCircle}
          variant="resolved"
          description="Closed within active 48-hour retention"
        />
      </div>

      {/* Queue Table Section */}
      <div>
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-[#E5E5DE]">
          <div>
            <h2 className="text-xl font-bold text-[#202522] tracking-tight">
              Prioritized Review Ledger
            </h2>
            <p className="text-xs text-[#68716B] mt-0.5">
              Sorted by operational priority and review urgency.
            </p>
          </div>
          <span className="text-xs font-mono text-[#68716B] bg-[#F0EFEA] px-2.5 py-1 rounded-md">
            {sortedPetitions.length} Records
          </span>
        </div>
        <PetitionTable petitions={sortedPetitions} role="officer" />
      </div>
    </div>
  );
}
