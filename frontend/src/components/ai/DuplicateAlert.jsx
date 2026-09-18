import { AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DuplicateAlert({ duplicateIds = [], similarityScores = [], role = 'officer' }) {
  if (!duplicateIds?.length || role === 'citizen') return null;

  return (
    <div className="rounded-2xl border border-[#F2DFD0] bg-[#FDF6F0] p-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#C58B5B] border border-[#F2DFD0] flex-shrink-0 mt-0.5">
          <AlertTriangle size={16} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C58B5B]">
              Geospatial Cluster Match
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#C58B5B] border border-[#F2DFD0]">
              200m Radius
            </span>
          </div>
          <p className="text-xs font-semibold text-[#202522] mt-1">
            Potential duplicate of {duplicateIds.length} existing petition{duplicateIds.length > 1 ? 's' : ''} in the vicinity.
          </p>
          <p className="text-[11px] text-[#68716B] mt-0.5 mb-3">
            Inspect historical records before concluding departmental action:
          </p>
          <ul className="space-y-2">
            {duplicateIds.map((id, i) => (
              <li key={id} className="flex items-center gap-3">
                <Link
                  to={`/${role}/petitions/${id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#315C4A] bg-white hover:bg-[#EFF4F0] px-2.5 py-1 rounded-md border border-[#E5E5DE] transition-colors"
                >
                  <Layers size={12} />
                  <span>#{id}</span>
                  <ArrowRight size={11} />
                </Link>
                {similarityScores[i] !== undefined && (
                  <span className="text-xs text-[#C58B5B] font-mono font-medium">
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
