import { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, AlertTriangle, Building2, Image, Search } from 'lucide-react';

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
    <div className="rounded-xl border border-[#D4E2D8] bg-white overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#202522] hover:bg-[#EFF4F0]/50 transition-colors"
      >
        <span className="text-xs font-mono uppercase tracking-wider text-[#315C4A]">
          Explainability Audit Breakdown
        </span>
        <div className="flex items-center gap-1.5 text-[#68716B] text-xs font-normal">
          <span>{open ? 'Hide details' : 'Inspect reasoning'}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-[#E5E5DE] border-t border-[#D4E2D8] bg-[#F8F7F2]/50">
          {reasons.map(({ key, icon: Icon, label }) => (
            explanation[key] ? (
              <div key={key} className="px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#68716B] uppercase tracking-wider mb-1">
                  <Icon size={12} className="text-[#315C4A]" />
                  {label}
                </div>
                <p className="text-xs text-[#202522] leading-relaxed pl-4 border-l-2 border-[#315C4A] ml-1">
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
