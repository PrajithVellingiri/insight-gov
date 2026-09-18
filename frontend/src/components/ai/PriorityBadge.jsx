import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

const config = {
  critical: { label: 'Critical', className: 'bg-[#FFF0EB] text-[#E13B22] border border-[#E13B22]/40', Icon: AlertTriangle },
  high:     { label: 'High',     className: 'bg-[#FFF0EB] text-[#F05A3C] border border-[#F05A3C]/40', Icon: ArrowUp },
  medium:   { label: 'Medium',   className: 'bg-[#EFEFEA] text-[#181817] border border-[#DDDCD7]', Icon: Minus },
  low:      { label: 'Low',      className: 'bg-white text-[#6F6F6A] border border-[#DDDCD7]', Icon: ArrowDown },
};

export default function PriorityBadge({ priority, size = 'sm' }) {
  const p = (priority || 'medium').toLowerCase();
  const { label, className, Icon } = config[p] ?? config.medium;
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold text-[10px] px-2 py-0.5 rounded', className, size === 'md' && 'text-xs px-2.5 py-1', size === 'lg' && 'text-xs px-3 py-1.5')}>
      <Icon size={11} />
      {label}
    </span>
  );
}
