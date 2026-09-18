import { formatDateShort } from '@/lib/utils';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusDotColors = {
  pending:      'text-[#F05A3C]', // Orange
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

export default function PetitionTable({ petitions = [], role }) {
  if (!petitions.length) {
    return (
      <div className="bg-white rounded-md border border-[#DDDCD7] p-12 text-center text-[#6F6F6A] text-xs font-mono">
        NO APPLICATIONS RECORDED IN THIS VIEW.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-[#DDDCD7] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F7F6F2] border-b border-[#DDDCD7]">
            <tr>
              <th className="px-5 py-3 font-mono font-bold uppercase tracking-wider text-[#6F6F6A] w-28">ID</th>
              <th className="px-5 py-3 font-bold uppercase tracking-wider text-[#6F6F6A] min-w-[260px]">Subject</th>
              <th className="px-5 py-3 font-bold uppercase tracking-wider text-[#6F6F6A]">Status</th>
              <th className="px-5 py-3 font-bold uppercase tracking-wider text-[#6F6F6A]">Priority</th>
              {role !== 'officer' && (
                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[#6F6F6A] hidden sm:table-cell">Department</th>
              )}
              <th className="px-5 py-3 font-bold uppercase tracking-wider text-[#6F6F6A] hidden md:table-cell">Date</th>
              <th className="px-5 py-3 font-bold uppercase tracking-wider text-[#6F6F6A] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDDCD7]">
            {petitions.map((p) => {
              const priority = (p.priority || p.ai_analysis?.priority || 'Medium').toLowerCase();
              const dotColor = statusDotColors[p.status] || 'text-[#6F6F6A]';
              const label = statusLabels[p.status] || p.status;
              const deptName = p.department_name || p.ai_analysis?.department || 'General';

              return (
                <tr
                  key={p.id}
                  className="hover:bg-[#FFF0EB]/30 transition-colors duration-150 group"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-[#181817]">
                    {p.petition_number}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-[#181817] group-hover:text-[#F05A3C] transition-colors truncate max-w-[260px] xl:max-w-[380px]">
                      {p.title}
                    </div>
                    {(p.latitude && p.longitude) && (
                      <div className="text-[10px] text-[#6F6F6A] mt-0.5 flex items-center gap-1 font-mono">
                        <MapPin size={10} className="text-[#F05A3C]" /> Geo-verified
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#181817]">
                      <span className={`text-base leading-none ${dotColor}`}>●</span>
                      <span>{label}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                        priority === 'critical'
                          ? 'bg-[#FFF0EB] text-[#E13B22] border border-[#E13B22]/30'
                          : priority === 'high'
                          ? 'bg-[#FFF0EB] text-[#F05A3C] border border-[#F05A3C]/30'
                          : 'bg-[#EFEFEA] text-[#181817]'
                      }`}
                    >
                      {priority}
                    </span>
                  </td>
                  {role !== 'officer' && (
                    <td className="px-5 py-3.5 font-medium text-[#181817] hidden sm:table-cell">
                      {deptName}
                    </td>
                  )}
                  <td className="px-5 py-3.5 font-mono text-[#6F6F6A] hidden md:table-cell">
                    {formatDateShort(p.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={role === 'officer' ? `/officer/petitions/${p.id}` : `/citizen/petitions/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-[#181817] hover:text-[#F05A3C] transition-colors"
                    >
                      <span>Review</span>
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
