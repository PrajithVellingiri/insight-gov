import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePetitions } from '@/hooks/usePetitions';
import PetitionCard from '@/components/petition/PetitionCard';
import { FilePlus, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { data: petitions = [], isLoading } = usePetitions({ citizen_id: user?.id });

  const total    = petitions.length;
  const pending  = petitions.filter((p) => ['pending', 'analysed', 'under_review'].includes(p.status)).length;
  const resolved = petitions.filter((p) => p.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your submitted petitions.</p>
        </div>
        <Link to="/citizen/petitions/new" className="btn-primary">
          <FilePlus size={15} /> New Petition
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Petitions', value: total,    Icon: FileText,    color: 'text-primary-600 bg-primary-50' },
          { label: 'In Progress',     value: pending,  Icon: Clock,       color: 'text-amber-600 bg-amber-50' },
          { label: 'Resolved',        value: resolved, Icon: CheckCircle, color: 'text-accent-600 bg-accent-50' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Petitions list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Your Petitions</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary-400" />
          </div>
        ) : petitions.length === 0 ? (
          <div className="card text-center py-14">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No petitions yet</p>
            <p className="text-slate-400 text-sm mb-5">Submit your first petition to get started.</p>
            <Link to="/citizen/petitions/new" className="btn-primary"><FilePlus size={14} /> Submit Petition</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {petitions.map((p) => (
              <PetitionCard key={p.id} petition={p} role="citizen" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
