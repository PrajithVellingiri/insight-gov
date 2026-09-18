import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { formatDateShort, truncate } from '@/lib/utils';

const statusDotColors = {
  pending:      'text-[#C58B5B]',
  analysed:     'text-[#315C4A]',
  under_review: 'text-[#C58B5B]',
  resolved:     'text-[#315C4A]',
  rejected:     'text-[#B91C1C]',
  duplicate:    'text-[#C8A96B]',
  withdrawn:    'text-[#68716B]',
};

const statusLabels = {
  pending:      'Pending Review',
  analysed:     'Triaged',
  under_review: 'Under Review',
  resolved:     'Resolved',
  rejected:     'Rejected',
  duplicate:    'Duplicate',
  withdrawn:    'Withdrawn',
};

export default function PetitionCard({ petition, role = 'citizen' }) {
  const { id, title, description, location, status, priority, category, created_at, ai_analysis } = petition;
  const pri = (priority || ai_analysis?.priority || 'medium').toLowerCase();
  const dotColor = statusDotColors[status] || 'text-[#68716B]';
  const label = statusLabels[status] || status;
  const basePath = role === 'officer' ? '/officer' : '/citizen';

  return (
    <Link to={`${basePath}/petitions/${id}`} className="block no-underline group">
      <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4D4CA] shadow-card hover:shadow-card-hover">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-[11px] font-mono font-semibold text-[#68716B]">
              {petition.petition_number}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202522]">
              <span className={`text-sm leading-none ${dotColor}`}>●</span>
              <span>{label}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-[#202522] leading-snug group-hover:text-[#315C4A] transition-colors mb-2">
            {title}
          </h3>

          <p className="text-xs text-[#68716B] leading-relaxed line-clamp-2 mb-4">
            {truncate(description, 120)}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E5E5DE]">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                pri === 'critical'
                  ? 'bg-[#FDF2F2] text-[#B91C1C]'
                  : pri === 'high'
                  ? 'bg-[#FDF6F0] text-[#C58B5B]'
                  : pri === 'low'
                  ? 'bg-[#EFF4F0] text-[#315C4A]'
                  : 'bg-[#FAF6ED] text-[#9A7B38]'
              }`}
            >
              {pri.charAt(0).toUpperCase() + pri.slice(1)} Priority
            </span>

            {(category || ai_analysis?.category) && (
              <span className="text-[11px] text-[#315C4A] bg-[#EFF4F0] px-2 py-0.5 rounded border border-[#D4E2D8]">
                {category || ai_analysis?.category}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#68716B] pt-3 mt-3 border-t border-[#E5E5DE]/60">
            {location ? (
              <span className="flex items-center gap-1 max-w-[150px] truncate" title={location}>
                <MapPin size={11} className="text-[#68716B] flex-shrink-0" /> {truncate(location, 20)}
              </span>
            ) : <span />}
            <span className="flex items-center gap-1 font-mono">
              <Calendar size={11} className="text-[#68716B] flex-shrink-0" /> {formatDateShort(created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
