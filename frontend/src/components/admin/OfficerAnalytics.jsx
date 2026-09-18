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
      <div className="bg-white rounded-md border border-[#DDDCD7] p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[#F7F6F2] border border-[#DDDCD7] flex items-center justify-center mb-3 text-[#181817]">
          <Briefcase size={20} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#181817]">Select Officer</h3>
        <p className="text-xs text-[#6F6F6A] max-w-sm mt-1.5 leading-relaxed font-mono">
          Select an officer from the personnel ledger on the left to inspect workload distribution and resolution metrics.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-[#DDDCD7] p-12 text-center min-h-[400px] flex flex-col items-center justify-center font-mono text-xs text-[#6F6F6A]">
        <Loader2 size={24} className="animate-spin text-[#181817] mb-3" />
        <p>AGGREGATING PERSONNEL METRICS...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-[#E13B22]/30 bg-[#FFF0EB] p-8 text-center text-[#E13B22] min-h-[400px] flex flex-col items-center justify-center">
        <XCircle size={24} className="mb-2" />
        <h3 className="font-bold text-xs font-mono uppercase">Failed to load analytics</h3>
        <p className="text-xs mt-1">{error?.response?.data?.detail || 'An error occurred.'}</p>
      </div>
    );
  }

  if (!data) return null;

  if (data.total_assigned === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
          <h2 className="text-lg font-bold text-[#181817]">{data.officer_name}</h2>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#F05A3C] mt-1">
            {data.department_name || 'Unassigned Department'}
          </p>
        </div>
        
        <div className="bg-white rounded-md border border-[#DDDCD7] p-12 text-center min-h-[260px] flex flex-col items-center justify-center">
          <p className="text-xs font-mono uppercase text-[#6F6F6A]">NO ACTIVE ASSIGNED PETITIONS RECORDED.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Docket */}
      <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
              OFFICER DOSSIER
            </span>
            <h2 className="text-2xl font-extrabold text-[#181817] tracking-tight uppercase mt-0.5">{data.officer_name}</h2>
            <p className="text-xs font-mono font-semibold text-[#F05A3C] mt-1">
              {data.department_name || 'Unassigned Department'}
            </p>
          </div>

          {data.is_demo && (
            <div className="bg-[#FFF0EB] text-[#F05A3C] border border-[#F05A3C]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
              Demo Data
            </div>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-md border border-[#DDDCD7] p-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block mb-1">
            TOTAL ASSIGNED
          </span>
          <p className="text-3xl font-extrabold text-[#181817] font-mono">{data.total_assigned}</p>
        </div>

        <div className="bg-white rounded-md border border-[#DDDCD7] p-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F05A3C] block mb-1">
            ACTIVE WORKLOAD
          </span>
          <p className="text-3xl font-extrabold text-[#F05A3C] font-mono">{data.active_workload}</p>
        </div>

        <div className="bg-white rounded-md border border-[#DDDCD7] p-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#181817] block mb-1">
            RESOLVED
          </span>
          <p className="text-3xl font-extrabold text-[#181817] font-mono">{data.resolved}</p>
        </div>

        <div className="bg-white rounded-md border border-[#DDDCD7] p-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block mb-1">
            RESOLUTION RATE
          </span>
          <p className="text-3xl font-extrabold text-[#181817] font-mono">{data.resolution_rate}%</p>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-white rounded-md border border-[#DDDCD7] p-5">
          <h3 className="text-xs font-mono font-bold text-[#181817] mb-3 uppercase tracking-wider border-b border-[#DDDCD7] pb-2">
            Status Breakdown
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F6F2] font-mono">
              <span className="text-[#181817] font-semibold flex items-center gap-2">
                <span className="text-[#F05A3C]">●</span> Pending Review
              </span>
              <span className="font-bold text-[#181817]">{data.pending}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F6F2] font-mono">
              <span className="text-[#181817] font-semibold flex items-center gap-2">
                <span className="text-[#FF7A59]">●</span> In Progress
              </span>
              <span className="font-bold text-[#181817]">{data.in_progress}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F6F2] font-mono">
              <span className="text-[#181817] font-semibold flex items-center gap-2">
                <span className="text-[#E13B22]">●</span> Rejected
              </span>
              <span className="font-bold text-[#181817]">{data.rejected}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F6F2] font-mono">
              <span className="text-[#181817] font-semibold flex items-center gap-2">
                <span className="text-[#6F6F6A]">●</span> Duplicate Linked
              </span>
              <span className="font-bold text-[#181817]">{data.duplicate || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Priority & Turnaround */}
        <div className="bg-white rounded-md border border-[#DDDCD7] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-[#181817] mb-3 uppercase tracking-wider border-b border-[#DDDCD7] pb-2">
              Priority Urgency
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center p-1">
                <span className="text-[#E13B22] font-bold">● Critical</span>
                <span className="font-bold text-[#E13B22]">{data.priority_breakdown?.critical || 0}</span>
              </div>
              <div className="flex justify-between items-center p-1">
                <span className="text-[#F05A3C] font-bold">● High</span>
                <span className="font-bold text-[#F05A3C]">{data.priority_breakdown?.high || 0}</span>
              </div>
              <div className="flex justify-between items-center p-1">
                <span className="text-[#181817] font-bold">● Medium</span>
                <span className="font-bold text-[#181817]">{data.priority_breakdown?.medium || 0}</span>
              </div>
              <div className="flex justify-between items-center p-1">
                <span className="text-[#6F6F6A] font-bold">● Low</span>
                <span className="font-bold text-[#6F6F6A]">{data.priority_breakdown?.low || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#DDDCD7]">
            <h4 className="text-[10px] font-mono font-bold text-[#6F6F6A] uppercase tracking-wider mb-0.5">
              Avg Turnaround
            </h4>
            <p className="text-2xl font-extrabold text-[#181817] font-mono">
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
