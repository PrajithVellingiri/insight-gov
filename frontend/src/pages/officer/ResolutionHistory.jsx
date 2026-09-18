import { useState } from 'react';
import { useResolutionHistory } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import EmptyState from '@/components/ui/EmptyState';
import { History, Loader2, CheckCircle, XCircle, Copy, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import usePageTitle from '@/hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All Determinations' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'duplicate', label: 'Duplicate' },
];

const STATUS_ICONS = {
  resolved: <CheckCircle size={14} className="text-emerald-400" />,
  rejected: <XCircle size={14} className="text-rose-400" />,
  duplicate: <Copy size={14} className="text-purple-400" />,
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
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles size={13} />
              Permanent Audit Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <History size={26} className="text-blue-400" />
            Resolution History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete administrative record of finalized petitions for{' '}
            <span className="font-semibold text-foreground">
              {user?.department_name || 'your department'}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl glass-panel border border-slate-800/80">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const count = value ? petitions.filter(p => p.status === value).length : petitions.length;
            const isSelected = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                    : 'bg-slate-900/60 text-muted-foreground border-slate-800 hover:bg-slate-800/70 hover:text-foreground'
                }`}
              >
                {STATUS_ICONS[value]}
                <span>{label}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800/80 text-[10px] font-mono border border-slate-700/60">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 transition-colors"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={36} className="animate-spin text-blue-400" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
          <p className="text-rose-400 font-bold text-sm">Failed to load resolution archive.</p>
          <p className="text-muted-foreground text-xs mt-1">Please verify network connection and refresh.</p>
        </div>
      )}

      {!isLoading && !isError && petitions.length === 0 && (
        <EmptyState
          title={statusFilter ? `No ${statusFilter} records located` : 'No finalized petitions on file'}
          description="Historical records will appear here as soon as department officers submit official determinations."
          icon={History}
        />
      )}

      {!isLoading && !isError && petitions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {petitions.length} Finalized Case{petitions.length !== 1 ? 's' : ''} on record
            </h2>
          </div>
          <PetitionTable petitions={petitions} role="officer" />
        </div>
      )}
    </div>
  );
}
