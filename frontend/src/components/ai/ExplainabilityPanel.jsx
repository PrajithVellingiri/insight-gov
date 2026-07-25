import { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, AlertTriangle, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const reasons = [
  { key: 'category_reason',   icon: Tag,           label: 'Category Reasoning' },
  { key: 'priority_reason',   icon: AlertTriangle, label: 'Priority Reasoning' },
  { key: 'department_reason', icon: Building2,     label: 'Department Routing' },
];

export default function ExplainabilityPanel({ explanation }) {
  const [open, setOpen] = useState(false);

  if (!explanation) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-primary-600">🧠</span>
          AI Reasoning
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="divide-y divide-slate-200 animate-fade-in">
          {reasons.map(({ key, icon: Icon, label }) => (
            explanation[key] ? (
              <div key={key} className="px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Icon size={12} />
                  {label}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{explanation[key]}</p>
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
