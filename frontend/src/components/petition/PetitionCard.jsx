import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { formatDateShort, truncate } from '@/lib/utils';

const statusDotColors = {
  pending:      'text-[#F05A3C]',
  analysed:     'text-[#F05A3C]',
  under_review: 'text-[#F05A3C]',
  resolved:     'text-[#181817]',
  rejected:     'text-[#E13B22]',
  duplicate:    'text-[#6F6F6A]',
  withdrawn:    'text-[#6F6F6A]',
};

const statusLabels = {
  pending:      'Pending',
  analysed:     'Triaged',
  under_review: 'Review',
  resolved:     'Approved',
  rejected:     'Rejected',
  duplicate:    'Duplicate',
  withdrawn:    'Withdrawn',
};

export default function PetitionCard({ petition, role = 'citizen' }) {
  const { id, title, description, location, status, priority, category, created_at, ai_analysis } = petition;
  const pri = (priority || ai_analysis?.priority || 'medium').toLowerCase();
  const dotColor = statusDotColors[status] || 'text-[#6F6F6A]';
  const label = statusLabels[status] || status;
  const basePath = role === 'officer' ? '/officer' : '/citizen';

  return (
    <Link to={`${basePath}/petitions/${id}`} className="block no-underline group">
      <div className="bg-white rounded-md border border-[#DDDCD7] p-5 h-full flex flex-col justify-between transition-colors hover:border-[#181817]">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="text-xs font-mono font-bold text-[#181817]">
              {petition.petition_number}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#181817]">
              <span className={`text-base leading-none ${dotColor}`}>●</span>
              <span>{label}</span>
            </span>
          </div>

          <h3 className="text-sm font-bold text-[#181817] leading-snug group-hover:text-[#F05A3C] transition-colors mb-2">
            {title}
          </h3>

          <p className="text-xs text-[#6F6F6A] leading-relaxed line-clamp-2 mb-4">
            {truncate(description, 120)}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DDDCD7]">
            <span
              className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                pri === 'critical'
                  ? 'bg-[#FFF0EB] text-[#E13B22] border border-[#E13B22]/30'
                  : pri === 'high'
                  ? 'bg-[#FFF0EB] text-[#F05A3C] border border-[#F05A3C]/30'
                  : 'bg-[#EFEFEA] text-[#181817]'
              }`}
            >
              {pri}
            </span>

            {(category || ai_analysis?.category) && (
              <span className="text-[10px] font-mono uppercase text-[#6F6F6A] bg-[#F7F6F2] px-2 py-0.5 rounded border border-[#DDDCD7]">
                {category || ai_analysis?.category}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#6F6F6A] pt-3 mt-3 border-t border-[#DDDCD7]/60">
            {location ? (
              <span className="flex items-center gap-1 max-w-[150px] truncate" title={location}>
                <MapPin size={10} className="text-[#F05A3C] flex-shrink-0" /> {truncate(location, 20)}
              </span>
            ) : <span />}
            <span className="flex items-center gap-1">
              <Calendar size={10} className="text-[#6F6F6A] flex-shrink-0" /> {formatDateShort(created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
