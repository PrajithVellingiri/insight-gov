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
    <div className="rounded-md border border-[#3A3A37] bg-[#222220] overflow-hidden text-[#F7F6F2]">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#F7F6F2] hover:bg-[#292927] transition-colors"
      >
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#F05A3C]">
          Audit Explainability Breakdown
        </span>
        <div className="flex items-center gap-1.5 text-[#A3A39E] text-xs font-mono">
          <span>{open ? 'Hide' : 'Inspect'}</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-[#292927] border-t border-[#3A3A37] bg-[#181817]">
          {reasons.map(({ key, icon: Icon, label }) => (
            explanation[key] ? (
              <div key={key} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A3A39E] uppercase tracking-wider">
                  <Icon size={11} className="text-[#F05A3C]" />
                  {label}
                </div>
                <p className="text-xs text-[#F7F6F2] leading-relaxed pl-3 border-l-2 border-[#F05A3C]">
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
