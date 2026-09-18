import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function StatusTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-xs font-mono text-[#6F6F6A] text-center py-4">NO AUDIT MILESTONES RECORDED.</p>;
  }

  return (
    <ol className="relative space-y-4">
      {history.map((item, i) => {
        const isLatest = i === 0;
        const isLast = i === history.length - 1;
        return (
          <li key={i} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  'h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0',
                  isLatest ? 'bg-[#F05A3C] ring-4 ring-[#FFF0EB]' : 'bg-[#181817]'
                )} 
              />
              {!isLast && <div className="w-px flex-1 bg-[#DDDCD7] my-1" />}
            </div>
            <div className="pb-3 flex-1">
              <p className={cn("text-xs font-mono font-bold uppercase tracking-wider", isLatest ? 'text-[#F05A3C]' : 'text-[#181817]')}>
                {item.new_status?.replace('_', ' ')}
              </p>
              {item.note && (
                <p className="text-xs text-[#181817] mt-1 bg-[#F7F6F2] p-2.5 rounded border border-[#DDDCD7] leading-relaxed font-sans">
                  {item.note}
                </p>
              )}
              {item.officer_name && (
                <p className="text-[11px] font-mono text-[#6F6F6A] mt-1">Logged by: {item.officer_name}</p>
              )}
              <p className="text-[10px] text-[#6F6F6A] mt-0.5 font-mono">{formatDate(item.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
