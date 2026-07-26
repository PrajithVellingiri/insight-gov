import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { formatDateShort, truncate } from '@/lib/utils';

const statusCls = {
  pending: 'badge-pending', analysed: 'badge-analysed',
  under_review: 'badge-analysed', resolved: 'badge-resolved',
  rejected: 'badge-rejected', duplicate: 'badge-duplicate',
};

export default function PetitionTable({ petitions = [], role = 'officer', loading }) {
  if (loading) {
    return (
      <div className="card">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg mb-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!petitions.length) {
    return (
      <div className="card text-center py-10 text-slate-400">
        <p className="text-sm">No petitions found.</p>
      </div>
    );
  }

  const basePath = role === 'officer' ? '/officer' : '/citizen';

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Department</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {petitions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{truncate(p.title, 50)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{truncate(p.location, 40)}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={statusCls[p.status] ?? 'badge'}>{p.status?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {(p.priority || p.ai_analysis?.priority) && (
                    <PriorityBadge priority={p.priority || p.ai_analysis?.priority} />
                  )}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-600">
                  {p.department_name || p.ai_analysis?.department || '—'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
                  {formatDateShort(p.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`${basePath}/petitions/${p.id}`}
                    className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 inline-flex no-underline"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
