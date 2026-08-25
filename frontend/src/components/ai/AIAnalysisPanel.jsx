import { Brain, Calendar } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import ConfidenceBar from './ConfidenceBar';
import ExplainabilityPanel from './ExplainabilityPanel';
import DuplicateAlert from './DuplicateAlert';
import { formatDate } from '@/lib/utils';

export default function AIAnalysisPanel({ analysis, role = 'officer', petition = null }) {
  if (!analysis) {
    return (
      <div className="ai-panel">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Brain size={16} className="animate-pulse-soft" />
          <span>AI analysis pending…</span>
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
      <div className="ai-panel space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-primary-600" />
          <span className="ai-label">AI Recommendation</span>
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(analyzed_at)}
          </span>
        </div>

        {/* Priority + Category row */}
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={priority} size="lg" />
          {category && (
            <span className="category-pill">{category}</span>
          )}
        </div>

        {/* Department Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {petition?.citizen_department_id && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Citizen Suggested</p>
              <p className="text-sm text-foreground">{petition.department_name || "Unknown"}</p>
            </div>
          )}
          {department && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">AI Recommended</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                {department}
                {petition?.department_match === true && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Match</span>
                )}
                {petition?.department_match === false && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Mismatch</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-card rounded-lg p-3.5 border border-primary-100">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Executive Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
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
