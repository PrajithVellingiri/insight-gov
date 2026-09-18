import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

function useCounter(endValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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

/**
 * Bold Typographic Metric Component.
 * Minimalist, high contrast, clean horizontal divider.
 */
export default function StatCard({
  label,
  value = 0,
  Icon,
  color,
  variant = 'default',
  trend,
  trendType = 'positive',
  description,
  className = '',
}) {
  const animatedValue = useCounter(value);

  return (
    <div
      className={cn(
        'bg-white border border-[#DDDCD7] rounded-lg p-5 transition-colors relative group',
        className
      )}
    >
      {/* Upper Label Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A]">
          {label}
        </span>
        {Icon && (
          <div className="text-[#181817] group-hover:text-[#F05A3C] transition-colors">
            <Icon size={16} strokeWidth={1.8} />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-3xl sm:text-4xl font-extrabold text-[#181817] tracking-tight font-sans">
          {typeof value === 'number' ? animatedValue.toLocaleString() : value}
        </div>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-mono font-semibold',
              trendType === 'positive' && 'text-[#181817]',
              trendType === 'negative' && 'text-[#E13B22]',
              trendType === 'neutral' && 'text-[#6F6F6A]'
            )}
          >
            {trendType === 'positive' && <TrendingUp size={12} className="text-[#F05A3C]" />}
            {trendType === 'negative' && <TrendingDown size={12} />}
            <span className="text-[#F05A3C]">{trend}</span>
          </span>
        )}
      </div>

      {description && (
        <div className="mt-3 pt-2.5 border-t border-[#DDDCD7]/70 text-[11px] text-[#6F6F6A] leading-relaxed">
          {description}
        </div>
      )}
    </div>
  );
}
