import { formatDate } from '@/lib/utils';
import { CheckCircle, Clock, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  pending:      { Icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  analysed:     { Icon: Eye,  color: 'text-blue-500',  bg: 'bg-blue-50' },
  under_review: { Icon: Eye,  color: 'text-blue-500',  bg: 'bg-blue-50' },
  resolved:     { Icon: CheckCircle, color: 'text-accent-500', bg: 'bg-accent-50' },
  rejected:     { Icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50' },
  duplicate:    { Icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
};

export default function StatusTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-sm text-slate-400 text-center py-4">No history yet.</p>;
  }

  return (
    <ol className="relative space-y-4">
      {history.map((item, i) => {
        const { Icon, color, bg } = iconMap[item.status] ?? iconMap.pending;
        const isLast = i === history.length - 1;
        return (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0', bg)}>
                <Icon size={14} className={color} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {item.status?.replace('_', ' ')}
              </p>
              {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
              {item.officer_name && (
                <p className="text-xs text-slate-400 mt-0.5">by {item.officer_name}</p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
