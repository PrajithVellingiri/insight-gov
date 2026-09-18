import React, { useState, useEffect } from 'react';
import Card3D from './Card3D';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

function useCounter(endValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = typeof endValue === 'number' ? endValue : parseInt(endValue, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();
    let frameId;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const current = Math.floor((progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)) * end);
      setCount(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setCount(end);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [endValue, duration]);

  return count;
}

export default function StatCard({
  label,
  value = 0,
  Icon,
  color = 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  glowColor = 'rgba(59, 130, 246, 0.2)',
  trend,
  trendType = 'positive', // positive | negative | neutral
  description,
  className = '',
}) {
  const animatedValue = useCounter(value);

  return (
    <Card3D className={cn('relative overflow-hidden group', className)}>
      {/* Background soft ambient glow */}
      <div
        className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-75"
        style={{ backgroundColor: glowColor }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-extrabold tracking-tight text-foreground"
              style={{ textShadow: '0 0 25px rgba(255, 255, 255, 0.08)' }}
            >
              {typeof value === 'number' ? animatedValue.toLocaleString() : value}
            </span>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border',
                  trendType === 'positive' && 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  trendType === 'negative' && 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                  trendType === 'neutral' && 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                )}
              >
                {trendType === 'positive' && <TrendingUp size={12} />}
                {trendType === 'negative' && <TrendingDown size={12} />}
                {trend}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition-transform duration-300 group-hover:scale-105',
              color
            )}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground mt-2 border-t border-border/40 pt-2">{description}</p>
      )}
    </Card3D>
  );
}
