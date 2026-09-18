import { useState } from 'react';
import { useResolutionHistory } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import EmptyState from '@/components/ui/EmptyState';
import { History, Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import usePageTitle from '@/hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All Determinations' },
  { value: 'resolved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'duplicate', label: 'Duplicate' },
];

const STATUS_ICONS = {
  resolved: <CheckCircle size={13} className="text-[#181817]" />,
  rejected: <XCircle size={13} className="text-[#E13B22]" />,
  duplicate: <Copy size={13} className="text-[#6F6F6A]" />,
};

export default function ResolutionHistory() {
  usePageTitle('Resolution History Archive');
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: petitions = [], isLoading, isError } = useResolutionHistory(
    statusFilter ? { status: statusFilter } : {}
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#DDDCD7] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
            PERMANENT ARCHIVE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
            RESOLUTION HISTORY
          </h1>
          <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
            Concluded dockets for {user?.department_name || 'your department'}
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-md bg-white border border-[#DDDCD7]">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const count = value ? petitions.filter(p => p.status === value).length : petitions.length;
            const isSelected = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isSelected
                    ? 'bg-[#181817] text-white'
                    : 'bg-[#F7F6F2] text-[#6F6F6A] border border-[#DDDCD7] hover:text-[#181817]'
                }`}
              >
                {STATUS_ICONS[value]}
                <span>{label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isSelected ? 'bg-[#292927] text-white' : 'bg-white text-[#181817]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs font-mono text-[#181817] hover:text-[#F05A3C] font-bold uppercase transition-colors"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={28} className="animate-spin text-[#181817]" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-md border border-[#E13B22]/30 bg-[#FFF0EB] p-6 text-center text-[#E13B22] font-mono text-xs">
          FAILED TO LOAD HISTORICAL ARCHIVE.
        </div>
      )}

      {!isLoading && !isError && petitions.length === 0 && (
        <EmptyState
          title="No Archive Records"
          description={
            statusFilter
              ? `No ${statusFilter} records found in historical docket.`
              : 'No resolved or finalized records recorded yet.'
          }
        />
      )}

      {!isLoading && !isError && petitions.length > 0 && (
        <PetitionTable petitions={petitions} role="officer" />
      )}
    </div>
  );
}
