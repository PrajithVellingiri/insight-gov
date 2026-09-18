import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const isLow = pct < 60;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#A3A39E] flex items-center gap-1.5">
          <Shield size={11} className="text-[#F05A3C]" />
          Confidence Assessment
        </span>
        <span className={cn('font-mono font-bold text-xs', isLow ? 'text-[#E13B22]' : 'text-[#F05A3C]')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#292927] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isLow ? 'bg-[#E13B22]' : 'bg-[#F05A3C]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-[10px] font-mono text-[#E13B22] mt-1">
          Low confidence score — manual review recommended
        </p>
      )}
    </div>
  );
}
