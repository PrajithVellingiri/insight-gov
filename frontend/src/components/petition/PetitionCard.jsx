import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import PriorityBadge from '@/components/ai/PriorityBadge';
import Card3D from '@/components/ui/Card3D';
import { formatDateShort, truncate } from '@/lib/utils';

const statusConfig = {
  pending:      { label: 'Pending',      cls: 'badge-pending' },
  analysed:     { label: 'Analysed',     cls: 'badge-analysed' },
  under_review: { label: 'Under Review', cls: 'badge-analysed' },
  resolved:     { label: 'Resolved',     cls: 'badge-resolved' },
  rejected:     { label: 'Rejected',     cls: 'badge-rejected' },
  duplicate:    { label: 'Duplicate',    cls: 'badge-duplicate' },
  withdrawn:    { label: 'Withdrawn',    cls: 'badge-duplicate' },
};

export default function PetitionCard({ petition, role = 'citizen' }) {
  const { id, title, description, location, status, priority, category, created_at, ai_analysis } = petition;
  const st = statusConfig[status] ?? { label: status, cls: 'badge' };
  const basePath = role === 'officer' ? '/officer' : '/citizen';

  return (
    <Link to={`${basePath}/petitions/${id}`} className="block no-underline group">
      <Card3D className="p-5 h-full flex flex-col justify-between hover:border-blue-500/40">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/60 text-muted-foreground group-hover:text-blue-400 group-hover:bg-blue-500/10 group-hover:translate-x-0.5 transition-all flex-shrink-0">
              <ArrowRight size={15} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
            {truncate(description, 120)}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3.5 pt-2 border-t border-slate-800/60">
            <span className={st.cls}>{st.label}</span>
            {(priority || ai_analysis?.priority) && (
              <PriorityBadge priority={priority || ai_analysis?.priority} />
            )}
            {petition.duplicate_count > 0 && (
              <span className="badge bg-purple-500/10 text-purple-400 border-purple-500/20">
                +{petition.duplicate_count} Similar
              </span>
            )}
            {(category || ai_analysis?.category) && (
              <span className="category-pill">{category || ai_analysis?.category}</span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-slate-800/40">
            <span className="font-mono text-blue-400/90 font-semibold">{petition.petition_number}</span>
            <div className="flex items-center gap-3">
              {location && (
                <span className="flex items-center gap-1 max-w-[140px] truncate" title={location}>
                  <MapPin size={11} className="text-muted-foreground flex-shrink-0" /> {truncate(location, 20)}
                </span>
              )}
              <span className="flex items-center gap-1 font-mono">
                <Calendar size={11} className="text-muted-foreground flex-shrink-0" /> {formatDateShort(created_at)}
              </span>
            </div>
          </div>
        </div>
      </Card3D>
    </Link>
  );
}
