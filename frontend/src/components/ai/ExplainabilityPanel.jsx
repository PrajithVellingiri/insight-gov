import { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, AlertTriangle, Building2, Image, Search, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const reasons = [
  { key: 'category_reason',   icon: Tag,           label: 'Category Rationale' },
  { key: 'priority_reason',   icon: AlertTriangle, label: 'Priority Escalation Rationale' },
  { key: 'department_reason', icon: Building2,     label: 'Department Routing Rationale' },
  { key: 'image_evidence_reason', icon: Image,     label: 'Visual Evidence Analysis' },
  { key: 'image_relevance',   icon: Search,        label: 'Image Relevance Score' },
];

export default function ExplainabilityPanel({ explanation }) {
  const [open, setOpen] = useState(false);

  if (!explanation) return null;

  return (
    <div className="rounded-xl border border-blue-500/25 bg-slate-950/60 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-800/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-cyan-400">
          <Sparkles size={14} className="text-blue-400" />
          Explainable AI Decision Breakdown
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs normal-case font-normal">
          <span>{open ? 'Collapse details' : 'View reasoning'}</span>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-slate-800/60 border-t border-slate-800/60 bg-slate-900/40 animate-fade-in">
          {reasons.map(({ key, icon: Icon, label }) => (
            explanation[key] ? (
              <div key={key} className="px-4 py-3.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                  <Icon size={13} className="text-cyan-400" />
                  {label}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-5 border-l border-blue-500/30 ml-1">
                  {explanation[key]}
                </p>
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
