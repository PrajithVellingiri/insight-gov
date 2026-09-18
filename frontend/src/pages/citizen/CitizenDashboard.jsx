import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePetitions } from '@/hooks/usePetitions';
import PetitionCard from '@/components/petition/PetitionCard';
import PetitionTable from '@/components/petition/PetitionTable';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilePlus, FileText, CheckCircle, Clock, Building2, LayoutGrid, List } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function CitizenDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('dashboard', 'Citizen Overview'));
  const { user } = useAuth();
  const { data: petitions = [], isLoading } = usePetitions({ citizen_id: user?.id });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

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

  const total    = petitions.length;
  const pending  = petitions.filter((p) => ['pending', 'analysed', 'under_review'].includes(p.status)).length;
  const resolved = petitions.filter((p) => p.status === 'resolved').length;
  
  // Count unique departments engaged
  const uniqueDepts = new Set(petitions.map(p => p.department_name || p.ai_analysis?.department).filter(Boolean)).size;

  return (
    <div className="space-y-10 pb-16 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="page-header">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
            01 / CITIZEN OVERVIEW
          </span>
          <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'Citizen'}
          </h1>
          <p className="text-sm text-[#68716B] mt-1.5 max-w-xl leading-relaxed">
            Monitor submitted applications, review milestones, and departmental resolution from one place.
          </p>
        </div>

        <Link to="/citizen/petitions/new" className="btn-primary btn-lg">
          <FilePlus size={16} /> Submit New Petition
        </Link>
      </div>

      {/* Differentiated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Applications"
          value={total}
          Icon={FileText}
          variant="applications"
          description="Total petitions recorded in state ledger"
        />
        <StatCard
          label="Pending Review"
          value={pending}
          Icon={Clock}
          variant="pending"
          description="Awaiting department review or triage"
        />
        <StatCard
          label="Approved / Resolved"
          value={resolved}
          Icon={CheckCircle}
          variant="resolved"
          description="Grievances successfully addressed"
        />
        <StatCard
          label="Ministries Engaged"
          value={uniqueDepts}
          Icon={Building2}
          variant="departments"
          description="Active departmental jurisdictions"
        />
      </div>

      {/* Petitions Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-4 border-t border-[#E5E5DE]">
          <div>
            <h2 className="text-xl font-bold text-[#202522] tracking-tight">
              Application Case Files
            </h2>
            <p className="text-xs text-[#68716B] mt-0.5">
              Verified record of your grievances and their current triage status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-[#E5E5DE] bg-white p-0.5 shadow-subtle">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[#EFF4F0] text-[#315C4A]'
                    : 'text-[#68716B] hover:text-[#202522]'
                }`}
              >
                <LayoutGrid size={14} /> Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#EFF4F0] text-[#315C4A]'
                    : 'text-[#68716B] hover:text-[#202522]'
                }`}
              >
                <List size={14} /> Ledger Table
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E5DE] p-6 space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : sortedPetitions.length === 0 ? (
          <EmptyState
            title="No Petitions on File"
            description="You have not submitted any civic petitions yet. File a petition to initiate autonomous department triage."
            action={
              <Link to="/citizen/petitions/new" className="btn-primary">
                <FilePlus size={16} /> File Your First Petition
              </Link>
            }
          />
        ) : viewMode === 'table' ? (
          <PetitionTable petitions={sortedPetitions} role="citizen" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedPetitions.map((p) => (
              <PetitionCard key={p.id} petition={p} role="citizen" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
