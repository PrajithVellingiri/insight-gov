import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

const config = {
  critical: { label: 'Critical', className: 'priority-critical', Icon: AlertTriangle },
  high:     { label: 'High',     className: 'priority-high',     Icon: ArrowUp },
  medium:   { label: 'Medium',   className: 'priority-medium',   Icon: Minus },
  low:      { label: 'Low',      className: 'priority-low',      Icon: ArrowDown },
};

export default function PriorityBadge({ priority, size = 'sm' }) {
  const p = (priority || 'medium').toLowerCase();
  const { label, className, Icon } = config[p] ?? config.medium;
  return (
    <span className={cn(className, size === 'lg' && 'text-sm px-3 py-1')}>
      <Icon size={10} />
      {label}
    </span>
  );
}
