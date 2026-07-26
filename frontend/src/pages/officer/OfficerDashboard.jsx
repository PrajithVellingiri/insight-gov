import { useAuth } from '@/context/AuthContext';
import { usePetitions } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import { AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const { data: petitions = [], isLoading } = usePetitions({ department_id: user?.department_id });

  const statusWeight = { pending: 2, analysed: 2, under_review: 2, resolved: 0, rejected: 0, duplicate: 0 };
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1, undefined: 0 };
  
  const sortedPetitions = [...petitions].sort((a, b) => {
    const sA = statusWeight[a.status] ?? 0;
    const sB = statusWeight[b.status] ?? 0;
    if (sA !== sB) return sB - sA;

    const pA = a.priority || a.ai_analysis?.priority;
    const pB = b.priority || b.ai_analysis?.priority;
    return priorityWeight[pB] - priorityWeight[pA];
  });

  const pending = petitions.filter((p) => p.status === 'analysed' || p.status === 'under_review');
  const critical = petitions.filter((p) => p.status !== 'resolved' && (p.priority === 'critical' || p.ai_analysis?.priority === 'critical'));
  const resolved = petitions.filter((p) => p.status === 'resolved');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.department_name || 'Your Department'} Queue</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText size={20} /></div>
          <div><p className="text-2xl font-bold text-slate-900">{pending.length}</p><p className="text-sm text-slate-500">Pending Review</p></div>
        </div>
        <div className="stat-card border border-red-100 bg-red-50/30">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600"><AlertTriangle size={20} /></div>
          <div><p className="text-2xl font-bold text-red-900">{critical.length}</p><p className="text-sm text-red-600 font-medium">Critical Alerts</p></div>
        </div>
        <div className="stat-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600"><CheckCircle size={20} /></div>
          <div><p className="text-2xl font-bold text-slate-900">{resolved.length}</p><p className="text-sm text-slate-500">Resolved (This Month)</p></div>
        </div>
      </div>

      {/* Queue Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Department Queue</h2>
        <PetitionTable petitions={sortedPetitions} loading={isLoading} role="officer" />
      </div>
    </div>
  );
}
