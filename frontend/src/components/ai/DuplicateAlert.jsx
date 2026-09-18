import { AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DuplicateAlert({ duplicateIds = [], similarityScores = [], role = 'officer' }) {
  if (!duplicateIds?.length || role === 'citizen') return null;

  return (
    <div className="rounded-md border border-[#F05A3C]/40 bg-[#FFF0EB] p-4 text-[#181817]">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-[#F05A3C] border border-[#F05A3C]/30 flex-shrink-0 mt-0.5">
          <AlertTriangle size={15} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F05A3C]">
              GEOSPATIAL CLUSTER RADAR
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#F05A3C] border border-[#F05A3C]/30">
              200m Radius
            </span>
          </div>
          <p className="text-xs font-bold text-[#181817] mt-1">
            Potential duplicate of {duplicateIds.length} existing petition{duplicateIds.length > 1 ? 's' : ''} in the vicinity.
          </p>
          <ul className="space-y-1.5 mt-2.5">
            {duplicateIds.map((id, i) => (
              <li key={id} className="flex items-center gap-3">
                <Link
                  to={`/${role}/petitions/${id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#181817] bg-white hover:bg-[#F7F6F2] px-2 py-0.5 rounded border border-[#DDDCD7] transition-colors"
                >
                  <Layers size={11} />
                  <span>#{id}</span>
                  <ArrowRight size={10} />
                </Link>
                {similarityScores[i] !== undefined && (
                  <span className="text-xs text-[#F05A3C] font-mono font-semibold">
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
