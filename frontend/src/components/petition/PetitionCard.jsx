import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import PriorityBadge from '@/components/ai/PriorityBadge';
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
    <Link
      to={`${basePath}/petitions/${id}`}
      className="block no-underline card-hover animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-semibold text-foreground leading-snug">{title}</h3>
        <ArrowRight size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>

      <p className="text-sm text-muted-foreground mb-3">{truncate(description, 100)}</p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={st.cls}>{st.label}</span>
        {(priority || ai_analysis?.priority) && (
          <PriorityBadge priority={priority || ai_analysis?.priority} />
        )}
        {petition.duplicate_count > 0 && (
          <span className="badge bg-secondary text-secondary-foreground ring-1 ring-border">
            +{petition.duplicate_count} Similar
          </span>
        )}
        {(category || ai_analysis?.category) && (
          <span className="category-pill">{category || ai_analysis?.category}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-mono">{petition.petition_number}</span>
        {location && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {truncate(location, 35)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={11} /> {formatDateShort(created_at)}
        </span>
      </div>
    </Link>
  );
}
