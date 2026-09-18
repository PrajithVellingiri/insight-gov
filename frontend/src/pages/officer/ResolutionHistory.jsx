import { useState } from 'react';
import { useResolutionHistory } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import EmptyState from '@/components/ui/EmptyState';
import { History, Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import usePageTitle from '@/hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All Determinations' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'duplicate', label: 'Duplicate' },
];

const STATUS_ICONS = {
  resolved: <CheckCircle size={14} className="text-[#315C4A]" />,
  rejected: <XCircle size={14} className="text-[#B91C1C]" />,
  duplicate: <Copy size={14} className="text-[#C8A96B]" />,
};

export default function ResolutionHistory() {
  usePageTitle('Resolution History Archive');
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: petitions = [], isLoading, isError } = useResolutionHistory(
    statusFilter ? { status: statusFilter } : {}
  );

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
            01 / ARCHIVE
          </span>
          <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight flex items-center gap-2.5">
            <History size={26} className="text-[#315C4A]" />
            Resolution History
          </h1>
          <p className="text-sm text-[#68716B] mt-1 max-w-xl leading-relaxed">
            Permanent public record of concluded petitions and formal determinations for{' '}
            <span className="font-semibold text-[#202522]">
              {user?.department_name || 'your department'}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-white border border-[#E5E5DE] shadow-card">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const count = value ? petitions.filter(p => p.status === value).length : petitions.length;
            const isSelected = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-[#EFF4F0] text-[#315C4A] border-[#D4E2D8] font-semibold'
                    : 'bg-white text-[#68716B] border-[#E5E5DE] hover:bg-[#F8F7F2]'
                }`}
              >
                {STATUS_ICONS[value]}
                <span>{label}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#F0EFEA] text-[10px] font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-[#315C4A] hover:underline font-medium px-2"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={32} className="animate-spin text-[#315C4A]" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-[#FBD5D5] bg-[#FDF2F2] p-8 text-center text-[#B91C1C]">
          Failed to load historical petition archive.
        </div>
      )}

      {!isLoading && !isError && petitions.length === 0 && (
        <EmptyState
          title="No Archive Records"
          description={
            statusFilter
              ? `No ${statusFilter} petitions found in the archive.`
              : 'No resolved or finalized petitions have been recorded yet.'
          }
        />
      )}

      {!isLoading && !isError && petitions.length > 0 && (
        <PetitionTable petitions={petitions} role="officer" />
      )}
    </div>
  );
}
