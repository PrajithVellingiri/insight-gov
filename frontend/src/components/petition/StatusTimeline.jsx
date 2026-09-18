import { formatDate } from '@/lib/utils';
import { CheckCircle, Clock, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  pending:      { Icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10 border border-amber-500/30' },
  analysed:     { Icon: Eye,           color: 'text-blue-400',    bg: 'bg-blue-500/10 border border-blue-500/30' },
  under_review: { Icon: Eye,           color: 'text-blue-400',    bg: 'bg-blue-500/10 border border-blue-500/30' },
  resolved:     { Icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/30' },
  rejected:     { Icon: XCircle,       color: 'text-rose-400',    bg: 'bg-rose-500/10 border border-rose-500/30' },
  duplicate:    { Icon: AlertTriangle, color: 'text-purple-400',  bg: 'bg-purple-500/10 border border-purple-500/30' },
};

export default function StatusTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-xs text-muted-foreground text-center py-4">No audit milestones recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-4">
      {history.map((item, i) => {
        const { Icon, color, bg } = iconMap[item.new_status] ?? iconMap.pending;
        const isLast = i === history.length - 1;
        return (
          <li key={i} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0 shadow-sm', bg)}>
                <Icon size={15} className={color} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-slate-800 my-1.5" />}
            </div>
            <div className="pb-4 pt-0.5">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                {item.new_status?.replace('_', ' ')}
              </p>
              {item.note && (
                <p className="text-xs text-slate-300 mt-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {item.note}
                </p>
              )}
              {item.officer_name && (
                <p className="text-[11px] text-blue-400 mt-1 font-medium">Logged by: {item.officer_name}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{formatDate(item.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
