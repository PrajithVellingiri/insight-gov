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
      <div className="card h-full flex flex-col items-center justify-center p-12 text-center min-h-[420px]">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF4F0] border border-[#D4E2D8] flex items-center justify-center mb-4 text-[#315C4A]">
          <Briefcase size={26} />
        </div>
        <h3 className="text-base font-bold text-[#202522]">Select an Officer</h3>
        <p className="text-xs text-[#68716B] max-w-sm mt-1.5 leading-relaxed">
          Select an officer from the personnel ledger on the left to inspect workload distribution, resolution throughput, and triage performance.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card h-full flex flex-col items-center justify-center min-h-[420px]">
        <Loader2 size={28} className="animate-spin text-[#315C4A] mb-3" />
        <p className="text-xs text-[#68716B]">Aggregating officer metrics and case histories...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card h-full flex flex-col items-center justify-center p-8 text-center bg-[#FDF2F2] border-[#F5C2C2] min-h-[420px]">
        <XCircle size={28} className="mb-2 text-[#9E4343]" />
        <h3 className="font-bold text-sm text-[#9E4343]">Failed to load analytics</h3>
        <p className="text-xs text-[#68716B] mt-1">{error?.response?.data?.detail || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.total_assigned === 0) {
    return (
      <div className="space-y-6 h-full">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[#202522]">{data.officer_name}</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#315C4A] mt-1">
            {data.department_name || 'Unassigned Department'}
          </p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
          <Briefcase size={28} className="mb-3 text-[#68716B]/40" />
          <h3 className="text-base font-semibold text-[#202522]">No petition activity recorded</h3>
          <p className="text-xs text-[#68716B] mt-1">This officer currently has no assigned petitions in the active ledger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Officer Header Card */}
      <div className="card p-6 relative overflow-hidden bg-white border border-[#E5E5DE]">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#68716B]">
              Officer Dossier
            </span>
            <h2 className="text-xl font-bold text-[#202522] tracking-tight mt-0.5">{data.officer_name}</h2>
            <p className="text-xs font-semibold text-[#315C4A] mt-1 tracking-wide">
              {data.department_name || 'Unassigned Department'}
            </p>
          </div>

          {data.is_demo && (
            <div className="bg-[#EFF4F0] text-[#315C4A] border border-[#D4E2D8] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} /> Demo Data
            </div>
          )}
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#EFF4F0] text-[#315C4A]">
              <Briefcase size={15} />
            </div>
            <h3 className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider">Total Assigned</h3>
          </div>
          <p className="text-2xl font-bold text-[#202522] font-mono">{data.total_assigned}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#FBF4EC] text-[#C58B5B]">
              <Activity size={15} />
            </div>
            <h3 className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider">Active Workload</h3>
          </div>
          <p className="text-2xl font-bold text-[#C58B5B] font-mono">{data.active_workload}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#EFF4F0] text-[#315C4A]">
              <CheckCircle2 size={15} />
            </div>
            <h3 className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider">Resolved</h3>
          </div>
          <p className="text-2xl font-bold text-[#315C4A] font-mono">{data.resolved}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#F8F7F2] text-[#68716B]">
              <Clock size={15} />
            </div>
            <h3 className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider">Resolution Rate</h3>
          </div>
          <p className="text-2xl font-bold text-[#202522] font-mono">{data.resolution_rate}%</p>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-[#202522] mb-4 uppercase tracking-wider flex items-center justify-between">
            <span>Status Distribution</span>
            <span className="text-[11px] font-mono font-normal text-[#68716B]">Caseload Breakdown</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#F8F7F2] border border-[#E5E5DE]/60">
              <span className="text-[#202522] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#C58B5B]" /> Pending Review
              </span>
              <span className="font-mono font-semibold text-[#202522] bg-white border border-[#E5E5DE] px-2 py-0.5 rounded">
                {data.pending}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#F8F7F2] border border-[#E5E5DE]/60">
              <span className="text-[#202522] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#315C4A]" /> In Progress
              </span>
              <span className="font-mono font-semibold text-[#202522] bg-white border border-[#E5E5DE] px-2 py-0.5 rounded">
                {data.in_progress}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#F8F7F2] border border-[#E5E5DE]/60">
              <span className="text-[#202522] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#9E4343]" /> Rejected
              </span>
              <span className="font-mono font-semibold text-[#202522] bg-white border border-[#E5E5DE] px-2 py-0.5 rounded">
                {data.rejected}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#F8F7F2] border border-[#E5E5DE]/60">
              <span className="text-[#202522] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#78917F]" /> Duplicate Linked
              </span>
              <span className="font-mono font-semibold text-[#202522] bg-white border border-[#E5E5DE] px-2 py-0.5 rounded">
                {data.duplicate || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#F8F7F2] border border-[#E5E5DE]/60">
              <span className="text-[#202522] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#68716B]" /> Withdrawn
              </span>
              <span className="font-mono font-semibold text-[#202522] bg-white border border-[#E5E5DE] px-2 py-0.5 rounded">
                {data.withdrawn}
              </span>
            </div>
          </div>
        </div>
        
        {/* Priority & Turnaround */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#202522] mb-4 uppercase tracking-wider flex items-center justify-between">
              <span>Priority Breakdown</span>
              <span className="text-[11px] font-mono font-normal text-[#68716B]">By Urgency</span>
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-[#F8F7F2] transition-colors">
                <span className="text-[#202522] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#9E4343]" /> Critical
                </span>
                <span className="font-mono font-semibold text-[#9E4343]">{data.priority_breakdown?.critical || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-[#F8F7F2] transition-colors">
                <span className="text-[#202522] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C58B5B]" /> High
                </span>
                <span className="font-mono font-semibold text-[#C58B5B]">{data.priority_breakdown?.high || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-[#F8F7F2] transition-colors">
                <span className="text-[#202522] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8A96B]" /> Medium
                </span>
                <span className="font-mono font-semibold text-[#202522]">{data.priority_breakdown?.medium || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-[#F8F7F2] transition-colors">
                <span className="text-[#202522] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#78917F]" /> Low
                </span>
                <span className="font-mono font-semibold text-[#68716B]">{data.priority_breakdown?.low || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-5 pt-4 border-t border-[#E5E5DE]">
            <h4 className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider mb-1">
              Avg Resolution Turnaround
            </h4>
            <p className="text-2xl font-bold text-[#202522] font-mono">
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
