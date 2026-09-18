import { CheckCircle2, AlertCircle, Shield, FileText, Calendar } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import ConfidenceBar from './ConfidenceBar';
import ExplainabilityPanel from './ExplainabilityPanel';
import DuplicateAlert from './DuplicateAlert';
import { formatDate } from '@/lib/utils';

export default function AIAnalysisPanel({ analysis, role = 'officer', petition = null }) {
  if (!analysis) {
    return (
      <div className="bg-[#EFF4F0] border border-[#D4E2D8] rounded-2xl p-6 text-sm text-[#315C4A]">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#315C4A]" />
          <span>Autonomous triage determination in progress...</span>
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

      {/* Main InsightGov Intelligence panel */}
      <div className="bg-[#EFF4F0] border border-[#D4E2D8] rounded-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D4E2D8] pb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#315C4A]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#315C4A]">
              INSIGHTGOV INTELLIGENCE
            </span>
          </div>
          <span className="text-[11px] text-[#68716B] font-mono flex items-center gap-1.5">
            <Calendar size={11} />
            {formatDate(analyzed_at)}
          </span>
        </div>

        {/* Priority + Category row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PriorityBadge priority={priority} size="md" />
          {category && (
            <span className="text-xs font-medium text-[#315C4A] bg-white px-2.5 py-1 rounded-md border border-[#D4E2D8]">
              {category}
            </span>
          )}
        </div>

        {/* Department Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-[#D4E2D8]">
          {petition?.citizen_department_id && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#68716B] mb-1">
                Citizen Preference
              </p>
              <p className="text-xs text-[#202522] font-medium">
                {petition.department_name || "Unspecified"}
              </p>
            </div>
          )}
          {department && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#68716B] mb-1">
                Autonomous Routing Target
              </p>
              <p className="text-xs font-bold text-[#202522] flex items-center gap-2">
                {department}
                {petition?.department_match === true && (
                  <span className="text-[10px] font-medium bg-[#EFF4F0] text-[#315C4A] border border-[#D4E2D8] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> Match
                  </span>
                )}
                {petition?.department_match === false && (
                  <span className="text-[10px] font-medium bg-[#FDF6F0] text-[#C58B5B] border border-[#F2DFD0] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={10} /> Mismatch
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="rounded-xl p-4 bg-white border border-[#D4E2D8]">
            <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#315C4A] mb-1">
              Executive Summary
            </p>
            <p className="text-xs text-[#202522] leading-relaxed font-normal">{summary}</p>
          </div>
        )}

        {/* Confidence */}
        <ConfidenceBar confidence={confidence} />

        {/* Explainability */}
        <ExplainabilityPanel explanation={explanation} />
      </div>
    </div>
  );
}
