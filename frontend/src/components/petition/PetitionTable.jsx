import { formatDateShort } from '@/lib/utils';
import { FileText, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function PetitionTable({ petitions = [], role }) {
  if (!petitions.length) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5DE] p-12 text-center text-[#68716B] text-sm">
        No applications or petitions in this view.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5DE] overflow-hidden shadow-card">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#F8F7F2] border-b border-[#E5E5DE]">
            <tr>
              <th className="px-6 py-3.5 text-xs font-mono font-semibold uppercase tracking-wider text-[#68716B] w-24">Reference</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B] min-w-[280px]">Subject</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B]">Status</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B]">Priority</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B] hidden md:table-cell">Applicant</th>
              {role !== 'officer' && (
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B] hidden xl:table-cell">Department</th>
              )}
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B] hidden lg:table-cell">Date</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68716B] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5DE]">
            {petitions.map((p) => {
              const priority = (p.priority || p.ai_analysis?.priority || 'Medium').toLowerCase();
              const dotColor = statusDotColors[p.status] || 'text-[#68716B]';
              const label = statusLabels[p.status] || p.status;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-[#F8F7F2]/60 transition-colors duration-150 group"
                >
                  <td className="px-6 py-4 text-xs font-mono font-semibold text-[#68716B]">
                    {p.petition_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#202522] group-hover:text-[#315C4A] transition-colors truncate max-w-[280px] xl:max-w-[380px]">
                      {p.title}
                    </div>
                    <div className="text-xs text-[#68716B] mt-0.5 flex items-center gap-3">
                      {p.ai_analysis?.category && (
                        <span className="text-[11px] text-[#68716B]">
                          {p.ai_analysis.category}
                        </span>
                      )}
                      {(p.latitude && p.longitude) && (
                        <span className="flex items-center gap-1 text-[11px] text-[#78917F]">
                          <MapPin size={11} /> Geo-verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202522]">
                      <span className={`text-base leading-none ${dotColor}`}>●</span>
                      <span>{label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                        priority === 'critical'
                          ? 'bg-[#FDF2F2] text-[#B91C1C]'
                          : priority === 'high'
                          ? 'bg-[#FDF6F0] text-[#C58B5B]'
                          : priority === 'low'
                          ? 'bg-[#EFF4F0] text-[#315C4A]'
                          : 'bg-[#FAF6ED] text-[#9A7B38]'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="font-medium text-[#202522] text-xs">{p.submitter_name || 'Citizen'}</div>
                    <div className="text-[11px] text-[#68716B] truncate max-w-[140px]">{p.submitter_email}</div>
                  </td>
                  {role !== 'officer' && (
                    <td className="px-6 py-4 hidden xl:table-cell text-xs text-[#68716B]">
                      <span className="truncate max-w-[180px] block">
                        {p.department_name ? `${p.department_code ? p.department_code + ' — ' : ''}${p.department_name}` : p.ai_analysis?.department || '—'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 hidden lg:table-cell text-xs text-[#68716B] font-mono">
                    {formatDateShort(p.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/${role === 'officer' ? 'officer' : 'citizen'}/petitions/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#315C4A] hover:underline"
                    >
                      <span>View File</span>
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
