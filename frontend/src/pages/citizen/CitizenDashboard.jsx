import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePetitions } from '@/hooks/usePetitions';
import PetitionCard from '@/components/petition/PetitionCard';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilePlus, FileText, CheckCircle, Clock, Sparkles } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function CitizenDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('dashboard', 'Citizen Dashboard'));
  const { user } = useAuth();
  const { data: petitions = [], isLoading } = usePetitions({ citizen_id: user?.id });

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

  const total    = petitions.length;
  const pending  = petitions.filter((p) => ['pending', 'analysed', 'under_review'].includes(p.status)).length;
  const resolved = petitions.filter((p) => p.status === 'resolved').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles size={13} />
              Citizen Redressal Command
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {t('citizen.welcome', 'Welcome back')}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('citizen.track_manage_desc', 'Monitor petition review milestones, officer updates, and AI routing in real time.')}
          </p>
        </div>
        <Link to="/citizen/petitions/new" className="btn-primary btn-lg shadow-[0_0_25px_rgba(37,99,235,0.35)]">
          <FilePlus size={18} /> {t('citizen.submit_petition', 'Submit New Petition')}
        </Link>
      </div>

      {/* 3D Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label={t('admin.total_petitions', 'Total Submitted')}
          value={total}
          Icon={FileText}
          color="text-blue-400 bg-blue-500/10 border-blue-500/25"
          glowColor="rgba(59, 130, 246, 0.25)"
          description="All lifetime petitions recorded in state ledger"
        />
        <StatCard
          label={t('status.pending', 'Active Reviews')}
          value={pending}
          Icon={Clock}
          color="text-amber-400 bg-amber-500/10 border-amber-500/25"
          glowColor="rgba(245, 158, 11, 0.25)"
          description="Currently under departmental processing"
        />
        <StatCard
          label={t('status.resolved', 'Resolved Cases')}
          value={resolved}
          Icon={CheckCircle}
          color="text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
          glowColor="rgba(16, 185, 129, 0.25)"
          description="Successfully resolved by ministry officers"
        />
      </div>

      {/* Petitions list */}
      <div>
        <div className="flex items-center justify-between mt-10 mb-5">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <FileText size={20} className="text-blue-400" />
            {t('citizen.recent_petitions', 'Your Petitions Ledger')}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-14 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedPetitions.length === 0 ? (
          <EmptyState
            title={t('citizen.no_petitions', 'No Petitions Filed Yet')}
            description={t('citizen.no_petitions_desc', "You haven't submitted any civic petitions. If you observe an issue in your community, raise it with our AI redressal platform.")}
            icon={FilePlus}
            action={
              <Link to="/citizen/petitions/new" className="btn-primary">
                {t('citizen.submit_petition', 'Submit your first petition')}
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedPetitions.map((p) => (
              <PetitionCard key={p.id} petition={p} role="citizen" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
