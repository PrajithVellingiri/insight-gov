import { ArrowLeft, Sparkles, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import PetitionForm from '@/components/petition/PetitionForm';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function SubmitPetition() {
  const { t } = useTranslation();
  usePageTitle(t('citizen.submit_a_petition', 'Submit Citizen Grievance'));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 mb-3 no-underline transition-colors"
        >
          <ArrowLeft size={14} /> {t('citizen.back_to_dashboard', 'Back to Dashboard')}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {t('citizen.submit_a_petition', 'Submit a Civic Grievance')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
          {t('citizen.submit_petition_desc', 'Describe your concern clearly. Our AI will automatically categorise, prioritise, and route it to the right department.')}
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-blue-500/25 p-4 flex items-center gap-3.5 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-400/30 flex-shrink-0">
          <Brain size={18} />
        </div>
        <p className="text-xs text-slate-300 leading-snug">
          <strong className="text-blue-400 font-semibold">Autonomous Triage:</strong> {t('citizen.ai_analysis_notice', 'Your petition will be analysed by AI within seconds of submission, extracting geospatial coordinates and routing it to the appropriate state ministry.')}
        </p>
      </div>

      <PetitionForm />
    </div>
  );
}
