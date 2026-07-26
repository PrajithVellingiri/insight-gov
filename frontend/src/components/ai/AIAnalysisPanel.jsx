import { Brain, Calendar } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import ConfidenceBar from './ConfidenceBar';
import ExplainabilityPanel from './ExplainabilityPanel';
import DuplicateAlert from './DuplicateAlert';
import { formatDate } from '@/lib/utils';

export default function AIAnalysisPanel({ analysis, role = 'officer', showOverride = false }) {
  if (!analysis) {
    return (
      <div className="ai-panel">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
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
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
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

        {/* Department */}
        {department && (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Recommended Department</p>
            <p className="text-sm font-semibold text-slate-800">{department}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="bg-white rounded-lg p-3.5 border border-primary-100">
            <p className="text-xs text-slate-500 mb-1 font-medium">Executive Summary</p>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
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
