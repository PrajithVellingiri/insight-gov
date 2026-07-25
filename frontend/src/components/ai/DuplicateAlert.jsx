import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DuplicateAlert({ duplicateIds = [], similarityScores = [], role = 'officer' }) {
  if (!duplicateIds?.length) return null;

  return (
    <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-800">
            ⚠ This petition may be a duplicate of {duplicateIds.length} existing petition{duplicateIds.length > 1 ? 's' : ''}.
          </p>
          <p className="text-xs text-orange-700 mt-1 mb-2">
            Please review the similar petition{duplicateIds.length > 1 ? 's' : ''} before taking action.
          </p>
          <ul className="space-y-1.5">
            {duplicateIds.map((id, i) => (
              <li key={id} className="flex items-center gap-2">
                <Link
                  to={`/${role}/petitions/${id}`}
                  className="text-xs font-mono text-orange-700 hover:text-orange-900 underline flex items-center gap-1 no-underline"
                >
                  {id} <ExternalLink size={10} />
                </Link>
                {similarityScores[i] !== undefined && (
                  <span className="text-xs text-orange-600 font-semibold">
                    {Math.round(similarityScores[i] * 100)}% similar
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
