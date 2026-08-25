import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePetitions } from '@/hooks/usePetitions';
import PetitionCard from '@/components/petition/PetitionCard';
import { FilePlus, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function CitizenDashboard() {
  const { t } = useTranslation();
  usePageTitle(t('dashboard', 'Dashboard'));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('citizen.welcome', 'Welcome back')}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('citizen.track_manage_desc', 'Track and manage your submitted petitions.')}</p>
        </div>
        <Link to="/citizen/petitions/new" className="btn-primary">
          <FilePlus size={15} /> {t('citizen.submit_petition', 'New Petition')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('admin.total_petitions', 'Total Petitions'), value: total,    Icon: FileText,    color: 'text-primary bg-primary/10' },
          { label: t('status.pending', 'In Progress'),     value: pending,  Icon: Clock,       color: 'text-amber-500 bg-amber-500/10' },
          { label: t('status.resolved', 'Resolved'),        value: resolved, Icon: CheckCircle, color: 'text-accent bg-accent/10' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Petitions list */}
      <div>
        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-primary-600" />
            {t('citizen.recent_petitions', 'Recent Petitions')}
          </h2>
          {petitions.length > 0 && (
            <Link to="/citizen/petitions" className="text-sm font-medium text-primary hover:underline">
              {t('common.view_all', 'View All')} &rarr;
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="card py-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-3 text-primary/40" />
            <p>{t('common.loading', 'Loading petitions...')}</p>
          </div>
        ) : sortedPetitions.length === 0 ? (
          <div className="card py-16 text-center border-dashed">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <FilePlus size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t('citizen.no_petitions', 'No Petitions Yet')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
              {t('citizen.no_petitions_desc', 'You haven\'t submitted any petitions. If you have an issue, raise your voice now.')}
            </p>
            <Link to="/citizen/petitions/new" className="btn-primary inline-flex">
              {t('citizen.submit_petition', 'Submit your first petition')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedPetitions.map((p) => (
              <PetitionCard key={p.id} petition={p} role="citizen" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
