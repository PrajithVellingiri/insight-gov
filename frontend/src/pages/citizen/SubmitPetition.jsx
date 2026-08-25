import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PetitionForm from '@/components/petition/PetitionForm';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function SubmitPetition() {
  const { t } = useTranslation();
  usePageTitle(t('citizen.submit_a_petition', 'Submit a Petition'));
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <Link to="/citizen/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 no-underline transition-colors">
            <ArrowLeft size={14} /> {t('citizen.back_to_dashboard', 'Back to Dashboard')}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('citizen.submit_a_petition', 'Submit a Petition')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('citizen.submit_petition_desc', 'Describe your concern clearly. Our AI will automatically categorise, prioritise, and route it to the right department.')}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary shadow-sm">
        🧠 {t('citizen.ai_analysis_notice', 'Your petition will be analysed by AI within seconds of submission.')}
      </div>

      <PetitionForm />
    </div>
  );
}
