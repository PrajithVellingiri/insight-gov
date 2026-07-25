import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const isLow = pct < 60;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">AI Confidence</span>
        <span className={cn('flex items-center gap-1 text-xs font-semibold', isLow ? 'text-amber-600' : 'text-accent-600')}>
          {isLow ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            isLow ? 'bg-amber-400' : 'bg-accent-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle size={11} />
          Low confidence — manual review recommended
        </p>
      )}
    </div>
  );
}
