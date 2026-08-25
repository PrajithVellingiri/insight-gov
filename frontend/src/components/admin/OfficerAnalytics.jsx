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
      <div className="card h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[400px]">
        <Briefcase size={32} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">Select an Officer</h3>
        <p className="text-sm mt-1">Click on an officer from the list to view their workload and performance analytics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card h-full flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-primary-500 mb-4" />
        <p className="text-sm text-muted-foreground">Loading officer analytics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card h-full flex flex-col items-center justify-center p-8 text-center text-red-600 bg-red-50/50 border border-red-100 min-h-[400px]">
        <XCircle size={32} className="mb-3 opacity-80" />
        <h3 className="font-semibold">Failed to load analytics</h3>
        <p className="text-sm opacity-80 mt-1">{error?.response?.data?.detail || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.total_assigned === 0) {
    return (
      <div className="space-y-6 h-full">
        <div className="card p-6 bg-primary-50/30 border border-primary-100/50">
          <h2 className="text-xl font-bold text-foreground">{data.officer_name}</h2>
          <p className="text-sm text-primary-700/80 mt-1">{data.department_name || 'Unassigned Department'}</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[300px]">
          <Briefcase size={32} className="mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No petition activity available</h3>
          <p className="text-sm mt-1">This officer has not been assigned any petitions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-primary-50/30 border border-primary-100/50">
        <h2 className="text-xl font-bold text-foreground">{data.officer_name}</h2>
        <p className="text-sm text-primary-700/80 mt-1">{data.department_name || 'Unassigned Department'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Briefcase size={18} />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Assigned</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.total_assigned}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
              <Activity size={18} />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Active Workload</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.active_workload}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Resolved</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.resolved}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Clock size={18} />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Resolution Rate</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.resolution_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Detailed Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2"><Clock size={14} /> Pending Review</span>
              <span className="font-medium text-foreground bg-slate-100 px-2 py-0.5 rounded">{data.pending}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2"><Activity size={14} /> In Progress</span>
              <span className="font-medium text-foreground bg-slate-100 px-2 py-0.5 rounded">{data.in_progress}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2"><XCircle size={14} /> Rejected</span>
              <span className="font-medium text-foreground bg-slate-100 px-2 py-0.5 rounded">{data.rejected}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2"><CheckCircle2 size={14} /> Duplicate</span>
              <span className="font-medium text-foreground bg-slate-100 px-2 py-0.5 rounded">{data.duplicate || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2"><ArchiveX size={14} /> Withdrawn</span>
              <span className="font-medium text-foreground bg-slate-100 px-2 py-0.5 rounded">{data.withdrawn}</span>
            </div>
          </div>
        </div>
        
        <div className="card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Priority Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Critical</span>
                <span className="font-medium text-red-600">{data.priority_breakdown?.critical || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High</span>
                <span className="font-medium text-orange-600">{data.priority_breakdown?.high || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Medium</span>
                <span className="font-medium text-amber-600">{data.priority_breakdown?.medium || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low</span>
                <span className="font-medium text-blue-600">{data.priority_breakdown?.low || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Avg Resolution Time</h3>
            <p className="text-2xl font-bold text-foreground">
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
