import { AlertTriangle, ExternalLink, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DuplicateAlert({ duplicateIds = [], similarityScores = [], role = 'officer' }) {
  if (!duplicateIds?.length || role === 'citizen') return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/50 to-amber-500/05 p-4 animate-fade-in shadow-[0_4px_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Geospatial Vector Match</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">200m Cluster</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1">
            Potential duplicate of {duplicateIds.length} existing petition{duplicateIds.length > 1 ? 's' : ''} in the vicinity.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            Review matching historical reports before confirming resolution:
          </p>
          <ul className="space-y-2">
            {duplicateIds.map((id, i) => (
              <li key={id} className="flex items-center gap-3">
                <Link
                  to={`/${role}/petitions/${id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/25 transition-colors"
                >
                  <Layers size={12} />
                  <span>{id}</span>
                  <ExternalLink size={11} />
                </Link>
                {similarityScores[i] !== undefined && (
                  <span className="text-xs text-amber-400 font-bold font-mono">
                    {Math.round(similarityScores[i] * 100)}% Similarity
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
