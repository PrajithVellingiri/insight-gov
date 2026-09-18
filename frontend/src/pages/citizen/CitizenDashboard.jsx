import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePetitions } from '@/hooks/usePetitions';
import PetitionCard from '@/components/petition/PetitionCard';
import PetitionTable from '@/components/petition/PetitionTable';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilePlus, LayoutGrid, List } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function CitizenDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('dashboard', 'Citizen Operations'));
  const { user } = useAuth();
  const { data: petitions = [], isLoading } = usePetitions({ citizen_id: user?.id });
  const [viewMode, setViewMode] = useState('table'); // default to operational table

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
  const uniqueDepts = new Set(petitions.map(p => p.department_name || p.ai_analysis?.department).filter(Boolean)).size;

  return (
    <div className="space-y-10 pb-16">
      {/* Editorial Dashboard Hero */}
      <div className="border-b border-[#DDDCD7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
              GOOD MORNING.
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight leading-tight">
              Government Operations<br />
              at a glance.
            </h1>
            <p className="text-xs sm:text-sm text-[#6F6F6A] mt-2 max-w-lg leading-relaxed">
              Monitor your submitted applications, departmental jurisdiction reviews, and administrative progress.
            </p>
          </div>

          <Link to="/citizen/petitions/new" className="btn-cta text-xs px-5 py-3 self-start md:self-auto">
            <FilePlus size={15} /> Submit Application
          </Link>
        </div>
      </div>

      {/* Typographic Operational Metrics (No traditional card grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-b border-[#DDDCD7]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
            TOTAL APPLICATIONS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {total}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Recorded in state ledger</p>
        </div>

        <div className="space-y-1 border-l border-[#DDDCD7] pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F05A3C]">
            PENDING REVIEW
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#F05A3C] font-mono">
            {pending}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Awaiting department action</p>
        </div>

        <div className="space-y-1 border-l border-[#DDDCD7] pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
            RESOLVED / PROCESSED
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {resolved}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Successfully completed</p>
        </div>

        <div className="space-y-1 border-l border-[#DDDCD7] pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
            MINISTRIES ENGAGED
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {uniqueDepts}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Active administrative lines</p>
        </div>
      </div>

      {/* Applications Ledger Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#DDDCD7]">
          <div>
            <h2 className="text-lg font-bold text-[#181817] uppercase tracking-wider font-mono">
              APPLICATIONS LEDGER
            </h2>
            <p className="text-xs text-[#6F6F6A] mt-0.5">
              Verified record of active civic dockets and triage timestamps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-[#DDDCD7] bg-white p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#181817] text-white'
                    : 'text-[#6F6F6A] hover:text-[#181817]'
                }`}
              >
                <List size={13} /> Ledger
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[#181817] text-white'
                    : 'text-[#6F6F6A] hover:text-[#181817]'
                }`}
              >
                <LayoutGrid size={13} /> Dockets
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#DDDCD7] p-4 rounded-md space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : sortedPetitions.length === 0 ? (
          <EmptyState
            title="No Applications Recorded"
            description="No petitions currently exist in your citizen ledger. Submit a new application to initiate autonomous triage."
            action={
              <Link to="/citizen/petitions/new" className="btn-primary text-xs">
                <FilePlus size={14} /> Submit First Application
              </Link>
            }
          />
        ) : viewMode === 'table' ? (
          <PetitionTable petitions={sortedPetitions} role="citizen" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedPetitions.map((p) => (
              <PetitionCard key={p.id} petition={p} role="citizen" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
