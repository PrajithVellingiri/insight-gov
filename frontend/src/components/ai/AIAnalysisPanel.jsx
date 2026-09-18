import { CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import ConfidenceBar from './ConfidenceBar';
import ExplainabilityPanel from './ExplainabilityPanel';
import DuplicateAlert from './DuplicateAlert';
import { formatDate } from '@/lib/utils';

export default function AIAnalysisPanel({ analysis, role = 'officer', petition = null }) {
  if (!analysis) {
    return (
      <div className="bg-[#181817] text-[#F7F6F2] border border-[#292927] rounded-lg p-6 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F05A3C] animate-pulse" />
          <span>AUTONOMOUS TRIAGE DETERMINATION IN PROGRESS...</span>
        </div>
      </div>
    );
  }

  const {
    category, department, priority, summary,
    confidence, analyzed_at, explanation,
    duplicate_ids, similarity_scores,
  } = analysis;

  return (
    <div className="space-y-4">
      {/* Duplicate alert */}
      <DuplicateAlert
        duplicateIds={duplicate_ids}
        similarityScores={similarity_scores}
        role={role}
      />

      {/* Main Charcoal Intelligence Panel */}
      <div className="bg-[#181817] text-[#F7F6F2] border border-[#292927] rounded-lg p-6 space-y-5 shadow-elevated">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292927] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F05A3C]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C]">
              INSIGHTGOV INTELLIGENCE
            </span>
          </div>
          <span className="text-[10px] text-[#A3A39E] font-mono flex items-center gap-1.5">
            <Calendar size={11} />
            {formatDate(analyzed_at)}
          </span>
        </div>

        {/* Priority + Category row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PriorityBadge priority={priority} size="md" />
          {category && (
            <span className="text-xs font-mono uppercase font-semibold text-[#F7F6F2] bg-[#292927] px-2.5 py-1 rounded border border-[#3A3A37]">
              {category}
            </span>
          )}
        </div>

        {/* Department Routing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-md bg-[#222220] border border-[#292927]">
          {petition?.citizen_department_id && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#6F6F6A] mb-1">
                Citizen Preference
              </p>
              <p className="text-xs text-[#F7F6F2] font-medium">
                {petition.department_name || "Unspecified"}
              </p>
            </div>
          )}
          {department && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#6F6F6A] mb-1">
                Routing Target
              </p>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                {department}
                {petition?.department_match === true && (
                  <span className="text-[10px] font-mono font-semibold bg-[#292927] text-[#F7F6F2] border border-[#3A3A37] px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-[#F05A3C]" /> Match
                  </span>
                )}
                {petition?.department_match === false && (
                  <span className="text-[10px] font-mono font-semibold bg-[#FFF0EB]/10 text-[#F05A3C] border border-[#F05A3C]/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertCircle size={10} /> Discrepancy
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="rounded-md p-4 bg-[#222220] border border-[#292927]">
            <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#F05A3C] mb-1">
              Executive Summary
            </p>
            <p className="text-xs text-[#E8E7E2] leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Confidence Assessment */}
        <ConfidenceBar confidence={confidence} />

        {/* Explainability Breakdown */}
        <ExplainabilityPanel explanation={explanation} />
      </div>
    </div>
  );
}
