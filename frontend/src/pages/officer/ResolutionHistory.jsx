import { useState } from 'react';
import { useResolutionHistory } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import { History, Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import usePageTitle from '@/hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All Outcomes' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'duplicate', label: 'Duplicate' },
];

const STATUS_ICONS = {
  resolved: <CheckCircle size={15} className="text-green-500" />,
  rejected: <XCircle size={15} className="text-red-500" />,
  duplicate: <Copy size={15} className="text-amber-500" />,
};

export default function ResolutionHistory() {
  usePageTitle('Resolution History');
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: petitions = [], isLoading, isError } = useResolutionHistory(
    statusFilter ? { status: statusFilter } : {}
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History size={22} />
            Resolution History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete record of finalized petitions for{' '}
            <span className="font-medium text-foreground">
              {user?.department_name || 'your department'}
            </span>
            . Includes resolved, rejected, and duplicate cases.
          </p>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.filter(o => o.value).map(({ value, label }) => {
          const count = petitions.filter(p => p.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(prev => prev === value ? '' : value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
              }`}
            >
              {STATUS_ICONS[value]}
              {label}
              <span className="ml-1 font-bold">{count}</span>
            </button>
          );
        })}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-primary hover:underline px-2"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Status Filter Tabs (alternative to pills for explicit selection) */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit border border-border">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === value
                ? 'bg-card shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="card bg-destructive/5 border border-destructive/20 text-center py-12">
          <p className="text-destructive font-semibold">Failed to load resolution history.</p>
          <p className="text-destructive/70 text-sm mt-1">Please try refreshing the page.</p>
        </div>
      )}

      {!isLoading && !isError && petitions.length === 0 && (
        <div className="card text-center py-16">
          <History size={36} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            {statusFilter
              ? `No ${statusFilter} petitions in history.`
              : 'No resolved, rejected, or duplicate petitions in history.'}
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Finalized petitions will appear here once an officer acts on them.
          </p>
        </div>
      )}

      {!isLoading && !isError && petitions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {petitions.length} petition{petitions.length !== 1 ? 's' : ''} found
              {statusFilter ? ` · filtered by ${statusFilter}` : ''}
            </h2>
          </div>
          <PetitionTable petitions={petitions} role="officer" />
        </div>
      )}
    </div>
  );
}
