import { formatDateShort } from '@/lib/utils';
import { FileText, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusStyles = {
  pending:      'badge-pending',
  analysed:     'badge-analysed',
  under_review: 'badge-analysed',
  resolved:     'badge-resolved',
  rejected:     'badge-rejected',
  duplicate:    'badge-duplicate',
  withdrawn:    'bg-slate-800/80 text-muted-foreground border-slate-700/60 line-through',
};

const priorityStyles = {
  critical: 'priority-critical',
  high:     'priority-high',
  medium:   'priority-medium',
  low:      'priority-low',
};

export default function PetitionTable({ petitions = [], role }) {
  if (!petitions.length) {
    return (
      <div className="card p-12 text-center text-muted-foreground text-sm">
        No petitions currently waiting in this queue.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/80 border-b border-slate-800/80">
            <tr>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-16 text-center">ID</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[300px]">Grievance Details</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status & Priority</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Citizen</th>
              {role !== 'officer' && (
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Assigned Ministry</th>
              )}
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Submitted</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {petitions.map((p) => {
              const priority = p.priority || p.ai_analysis?.priority;
              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-800/40 transition-colors duration-150 group"
                >
                  <td className="px-5 py-4 text-center text-xs font-mono text-blue-400/90 font-semibold">
                    {p.petition_number}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-foreground group-hover:text-blue-400 transition-colors truncate max-w-[300px] xl:max-w-[420px]">
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      {p.ai_analysis?.category && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-300">
                          <FileText size={11} className="text-blue-400" /> {p.ai_analysis.category}
                        </span>
                      )}
                      {(p.latitude && p.longitude) && (
                        <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                          <MapPin size={11} /> GPS tagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${statusStyles[p.status] || statusStyles.pending}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                      {priority && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityStyles[priority.toLowerCase()] || ''}`}>
                          {priority} Priority
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="font-semibold text-foreground text-xs">{p.submitter_name || 'Citizen'}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]">{p.submitter_email}</div>
                  </td>
                  {role !== 'officer' && (
                    <td className="px-5 py-4 hidden xl:table-cell text-xs text-muted-foreground">
                      <span className="truncate max-w-[200px] block font-medium">
                        {p.department_name ? `${p.department_code || ''} ${p.department_name}` : p.ai_analysis?.department || '—'}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-muted-foreground" />
                      {formatDateShort(p.created_at)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/${role}/petitions/${p.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 transition-all duration-200"
                    >
                      Open <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
