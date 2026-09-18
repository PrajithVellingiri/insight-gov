import { Brain, Calendar, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import ConfidenceBar from './ConfidenceBar';
import ExplainabilityPanel from './ExplainabilityPanel';
import DuplicateAlert from './DuplicateAlert';
import { formatDate } from '@/lib/utils';

export default function AIAnalysisPanel({ analysis, role = 'officer', petition = null }) {
  if (!analysis) {
    return (
      <div className="ai-panel">
        <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
          <Brain size={18} className="animate-pulse text-blue-400" />
          <span>Processing real-time neural analysis…</span>
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
    <div className="space-y-4 animate-fade-in">
      {/* Duplicate alert — prominent, at the top */}
      <DuplicateAlert
        duplicateIds={duplicate_ids}
        similarityScores={similarity_scores}
        role={role}
      />

      {/* Main AI panel */}
      <div className="ai-panel space-y-5 border-blue-500/30">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-400 border border-blue-400/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Brain size={16} />
            </div>
            <span className="ai-label">Autonomous AI Determination</span>
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
            <Calendar size={11} />
            {formatDate(analyzed_at)}
          </span>
        </div>

        {/* Priority + Category row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PriorityBadge priority={priority} size="lg" />
          {category && (
            <span className="category-pill">{category}</span>
          )}
        </div>

        {/* Department Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          {petition?.citizen_department_id && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Citizen Preference</p>
              <p className="text-sm text-foreground font-medium">{petition.department_name || "Unspecified"}</p>
            </div>
          )}
          {department && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Neural AI Recommendation</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                {department}
                {petition?.department_match === true && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> Match
                  </span>
                )}
                {petition?.department_match === false && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={10} /> Mismatch
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="rounded-xl p-4 bg-slate-950/70 border border-blue-500/20 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={12} /> Executive Analysis Summary
            </p>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">{summary}</p>
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
