import { useQuery } from '@tanstack/react-query';
import { getOfficerAnalytics } from '@/api/admin.api';
import { Loader2, Briefcase, CheckCircle2, Clock, XCircle, Activity, ArchiveX } from 'lucide-react';

export default function OfficerAnalytics({ officer }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'officerAnalytics', officer?.id],
    queryFn: () => getOfficerAnalytics(officer.id),
    enabled: !!officer?.id,
  });

  if (!officer) {
    return (
      <div className="glass-panel h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[400px] rounded-2xl border border-slate-800/80">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-glow-blue">
          <Briefcase size={28} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Select an Officer</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">Select an officer from the roster on the left to inspect real-time workload, resolution speed, and triage status.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-panel h-full flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-slate-800/80">
        <Loader2 size={32} className="animate-spin text-cyan-400 mb-4" />
        <p className="text-sm text-slate-400">Aggregating officer metrics and history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel h-full flex flex-col items-center justify-center p-8 text-center text-rose-400 bg-rose-500/5 border border-rose-500/20 min-h-[400px] rounded-2xl">
        <XCircle size={32} className="mb-3 opacity-80" />
        <h3 className="font-semibold text-foreground">Failed to load analytics</h3>
        <p className="text-sm text-slate-400 mt-1">{error?.response?.data?.detail || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.total_assigned === 0) {
    return (
      <div className="space-y-6 h-full">
        <div className="glass-panel p-6 border border-slate-800/80 rounded-2xl">
          <h2 className="text-xl font-bold text-foreground">{data.officer_name}</h2>
          <p className="text-sm text-cyan-400 mt-1">{data.department_name || 'Unassigned Department'}</p>
        </div>
        
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[300px] rounded-2xl border border-slate-800/80">
          <Briefcase size={32} className="mb-4 opacity-50 text-slate-500" />
          <h3 className="text-lg font-medium text-foreground">No petition activity available</h3>
          <p className="text-sm text-slate-400 mt-1">This officer has not been assigned any petitions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel-elevated p-6 border border-blue-500/30 rounded-2xl relative overflow-hidden shadow-glow-blue">
        {data.is_demo && (
          <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
            <Activity size={12} /> Demo Data
          </div>
        )}
        <h2 className="text-xl font-bold text-foreground tracking-tight">{data.officer_name}</h2>
        <p className="text-sm text-cyan-400 mt-1 font-medium">{data.department_name || 'Unassigned Department'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all shadow-card-3d">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Briefcase size={18} />
            </div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Assigned</h3>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{data.total_assigned}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all shadow-card-3d">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Activity size={18} />
            </div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Workload</h3>
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{data.active_workload}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all shadow-card-3d">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolved</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{data.resolved}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all shadow-card-3d">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Clock size={18} />
            </div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolution Rate</h3>
          </div>
          <p className="text-2xl font-bold text-cyan-400 font-mono">{data.resolution_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-card-3d">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Detailed Breakdown</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <span className="text-slate-300 flex items-center gap-2 text-xs"><Clock size={14} className="text-amber-400" /> Pending Review</span>
              <span className="font-mono text-xs font-semibold text-foreground bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full">{data.pending}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <span className="text-slate-300 flex items-center gap-2 text-xs"><Activity size={14} className="text-blue-400" /> In Progress</span>
              <span className="font-mono text-xs font-semibold text-foreground bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full">{data.in_progress}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <span className="text-slate-300 flex items-center gap-2 text-xs"><XCircle size={14} className="text-rose-400" /> Rejected</span>
              <span className="font-mono text-xs font-semibold text-foreground bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full">{data.rejected}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <span className="text-slate-300 flex items-center gap-2 text-xs"><CheckCircle2 size={14} className="text-cyan-400" /> Duplicate Linked</span>
              <span className="font-mono text-xs font-semibold text-foreground bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full">{data.duplicate || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <span className="text-slate-300 flex items-center gap-2 text-xs"><ArchiveX size={14} className="text-slate-400" /> Withdrawn</span>
              <span className="font-mono text-xs font-semibold text-foreground bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full">{data.withdrawn}</span>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-card-3d flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Priority Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-glow-rose" /> Critical
                </span>
                <span className="font-mono text-xs font-semibold text-rose-400">{data.priority_breakdown?.critical || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-glow-amber" /> High
                </span>
                <span className="font-mono text-xs font-semibold text-amber-400">{data.priority_breakdown?.high || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
                </span>
                <span className="font-mono text-xs font-semibold text-yellow-300">{data.priority_breakdown?.medium || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-glow-blue" /> Low
                </span>
                <span className="font-mono text-xs font-semibold text-blue-400">{data.priority_breakdown?.low || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Avg Resolution Turnaround</h3>
            <p className="text-2xl font-bold text-foreground font-mono">
              {data.average_resolution_days !== null && data.average_resolution_days !== undefined
                ? `${data.average_resolution_days} days` 
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
