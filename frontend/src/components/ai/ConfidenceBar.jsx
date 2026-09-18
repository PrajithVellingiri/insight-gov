import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const isLow = pct < 60;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-blue-400" />
          Model Confidence Score
        </span>
        <span className={cn('flex items-center gap-1 font-mono font-bold text-xs', isLow ? 'text-amber-400' : 'text-emerald-400')}>
          {isLow ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 shadow-sm',
            isLow
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
          <AlertTriangle size={11} />
          Low confidence recommendation — human verification advised
        </p>
      )}
    </div>
  );
}
