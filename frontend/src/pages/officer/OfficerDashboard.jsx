import { useAuth } from '@/context/AuthContext';
import { useActivePetitions } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function OfficerDashboard() {
  const { t } = useTranslation();
  usePageTitle('Officer Queue Operations');
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
    <div className="space-y-10 pb-16">
      {/* Editorial Header */}
      <div className="border-b border-[#DDDCD7] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
            GOVERNMENT OPERATIONS
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
            GRIEVANCE QUEUE
          </h1>
          <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
            {user?.department_name || 'Department Jurisdiction'} — Active Triage Queue
          </p>
        </div>
      </div>

      {/* Typographic Operational Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4 border-b border-[#DDDCD7]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F05A3C]">
            PENDING REVIEW
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#F05A3C] font-mono">
            {pending.length}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Awaiting official determination</p>
        </div>

        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-[#DDDCD7] pt-4 sm:pt-0 sm:pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E13B22]">
            CRITICAL PRIORITY
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#E13B22] font-mono">
            {critical.length}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Immediate escalation status</p>
        </div>

        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-[#DDDCD7] pt-4 sm:pt-0 sm:pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#181817]">
            FINALIZED CASES
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#181817] font-mono">
            {recentlyFinalized.length}
          </div>
          <p className="text-[11px] text-[#6F6F6A]">Formally concluded in ledger</p>
        </div>
      </div>

      {/* Queue Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD7]">
          <div>
            <h2 className="text-sm font-mono font-bold text-[#181817] uppercase tracking-wider">
              PRIORITIZED REVIEW LEDGER
            </h2>
            <p className="text-xs text-[#6F6F6A] mt-0.5">
              Ranked by urgency level and statutory turnaround guidelines.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#181817] bg-white px-2.5 py-1 rounded border border-[#DDDCD7]">
            {sortedPetitions.length} Records
          </span>
        </div>
        <PetitionTable petitions={sortedPetitions} role="officer" />
      </div>
    </div>
  );
}
