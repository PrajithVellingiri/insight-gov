import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const isLow = pct < 60;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#68716B] flex items-center gap-1.5">
          <Shield size={12} className="text-[#315C4A]" />
          Confidence Assessment
        </span>
        <span className={cn('font-mono font-bold text-xs', isLow ? 'text-[#C58B5B]' : 'text-[#315C4A]')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white overflow-hidden border border-[#D4E2D8]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isLow ? 'bg-[#C58B5B]' : 'bg-[#315C4A]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-[11px] text-[#C58B5B] font-medium mt-1">
          Low confidence score — manual officer assessment recommended
        </p>
      )}
    </div>
  );
}
