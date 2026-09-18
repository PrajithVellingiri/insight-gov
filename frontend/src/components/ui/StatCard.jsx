import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

function useCounter(endValue, duration = 900) {
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
 * Minimalist GovTech KPI Card.
 * Clean, flat, spacious, with subtle editorial variations.
 */
export default function StatCard({
  label,
  value = 0,
  Icon,
  color, // optional override
  variant = 'default', // 'applications' | 'pending' | 'resolved' | 'departments' | 'default'
  trend,
  trendType = 'positive', // positive | negative | neutral
  description,
  className = '',
}) {
  const animatedValue = useCounter(value);

  // Determine variant styling based on explicit prop or label text
  let styleVariant = variant;
  const lowerLabel = (label || '').toLowerCase();
  if (styleVariant === 'default') {
    if (lowerLabel.includes('pending') || lowerLabel.includes('review') || lowerLabel.includes('critical')) {
      styleVariant = 'pending';
    } else if (lowerLabel.includes('resolved') || lowerLabel.includes('approved') || lowerLabel.includes('closed')) {
      styleVariant = 'resolved';
    } else if (lowerLabel.includes('department') || lowerLabel.includes('ministr') || lowerLabel.includes('rate')) {
      styleVariant = 'departments';
    } else {
      styleVariant = 'applications';
    }
  }

  // Styles per variant
  const variantClasses = {
    applications: {
      card: 'bg-white border-[#E5E5DE]',
      iconBox: 'bg-[#EFF4F0] text-[#315C4A]',
      accentText: 'text-[#315C4A]',
      badge: 'bg-[#EFF4F0] text-[#315C4A]',
    },
    pending: {
      card: 'bg-[#FBF9F5] border-[#EFE8DC]',
      iconBox: 'bg-[#FDF6F0] text-[#C58B5B]',
      accentText: 'text-[#C58B5B]',
      badge: 'bg-[#FDF6F0] text-[#C58B5B]',
    },
    resolved: {
      card: 'bg-[#F2F6F3] border-[#DFE9E3]',
      iconBox: 'bg-[#E2ECE6] text-[#315C4A]',
      accentText: 'text-[#315C4A]',
      badge: 'bg-[#E2ECE6] text-[#315C4A]',
    },
    departments: {
      card: 'bg-white border-[#E5E5DE]',
      iconBox: 'bg-[#FAF6ED] text-[#9A7B38]',
      accentText: 'text-[#9A7B38]',
      badge: 'bg-[#FAF6ED] text-[#9A7B38]',
    },
  }[styleVariant] || {
    card: 'bg-white border-[#E5E5DE]',
    iconBox: 'bg-[#EFF4F0] text-[#315C4A]',
    accentText: 'text-[#315C4A]',
    badge: 'bg-[#EFF4F0] text-[#315C4A]',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-all duration-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5',
        variantClasses.card,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#68716B]">
          {label}
        </span>
        {Icon && (
          <div className={cn('p-2 rounded-lg transition-colors', variantClasses.iconBox)}>
            <Icon size={18} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-3xl lg:text-4xl font-bold font-sans tracking-tight text-[#202522]">
          {typeof value === 'number' ? animatedValue.toLocaleString() : value}
        </div>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              trendType === 'positive' && 'bg-[#EFF4F0] text-[#315C4A]',
              trendType === 'negative' && 'bg-[#FDF2F2] text-[#B91C1C]',
              trendType === 'neutral' && 'bg-[#F0EFEA] text-[#68716B]'
            )}
          >
            {trendType === 'positive' && <TrendingUp size={12} />}
            {trendType === 'negative' && <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-[#68716B] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
