import { formatDateShort } from '@/lib/utils';
import { FileText, MapPin, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusStyles = {
  pending: 'badge-pending',
  analysed: 'badge-analysed',
  under_review: 'badge-analysed', // reuse analysed style or create a new one, but for now this adapts safely
  resolved: 'badge-resolved',
  rejected: 'badge-rejected',
  duplicate: 'badge-duplicate',
  withdrawn: 'bg-muted text-muted-foreground border-border line-through',
};

const priorityStyles = {
  critical: 'priority-critical',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export default function PetitionTable({ petitions, role }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/80 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground w-12 text-center">ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground min-w-[300px]">Details</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status & Priority</th>
              <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Submitter</th>
              {role !== 'officer' && (
                <th className="px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Department</th>
              )}
              <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {petitions.map((p) => {
              const priority = p.priority || p.ai_analysis?.priority;
              return (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono">
                    {p.petition_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground truncate max-w-[300px] xl:max-w-[400px]">
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      {p.ai_analysis?.category && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} /> {p.ai_analysis.category}
                        </span>
                      )}
                      {(p.latitude && p.longitude) && (
                        <span className="flex items-center gap-1 text-primary/70">
                          <MapPin size={12} /> Location tagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyles[p.status] || statusStyles.pending}`}>
                        {p.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {priority && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityStyles[priority.toLowerCase()]}`}>
                          {priority} Priority
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="font-medium text-foreground">{p.submitter_name || 'Anonymous'}</div>
                    <div className="text-xs text-muted-foreground">{p.submitter_email}</div>
                  </td>
                  {role !== 'officer' && (
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                      {p.department_name ? `${p.department_code || ''} - ${p.department_name}` : p.ai_analysis?.department || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-muted-foreground" />
                      {formatDateShort(p.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      to={`/${role}/petitions/${p.id}`} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      View <ExternalLink size={13} />
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
