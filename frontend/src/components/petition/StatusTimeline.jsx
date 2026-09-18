import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const dotColors = {
  pending:      'border-[#C58B5B] bg-[#C58B5B]',
  analysed:     'border-[#315C4A] bg-[#315C4A]',
  under_review: 'border-[#C58B5B] bg-[#C58B5B]',
  resolved:     'border-[#315C4A] bg-[#315C4A]',
  rejected:     'border-[#B91C1C] bg-[#B91C1C]',
  duplicate:    'border-[#C8A96B] bg-[#C8A96B]',
};

export default function StatusTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-xs text-[#68716B] text-center py-4">No audit milestones recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-4">
      {history.map((item, i) => {
        const dotColor = dotColors[item.new_status] || 'border-[#315C4A] bg-[#315C4A]';
        const isLast = i === history.length - 1;
        return (
          <li key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ring-4 ring-[#F8F7F2]', dotColor)} />
              {!isLast && <div className="w-px flex-1 bg-[#E5E5DE] my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-xs font-semibold text-[#202522] uppercase tracking-wider">
                {item.new_status?.replace('_', ' ')}
              </p>
              {item.note && (
                <p className="text-xs text-[#202522] mt-1 bg-[#F8F7F2] p-2.5 rounded-lg border border-[#E5E5DE] leading-relaxed">
                  {item.note}
                </p>
              )}
              {item.officer_name && (
                <p className="text-[11px] text-[#315C4A] mt-1 font-medium">Logged by: {item.officer_name}</p>
              )}
              <p className="text-[11px] text-[#68716B] mt-0.5 font-mono">{formatDate(item.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
