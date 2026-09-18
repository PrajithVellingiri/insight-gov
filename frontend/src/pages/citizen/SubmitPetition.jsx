import { ArrowLeft, Shield } from 'lucide-react';
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C4A] hover:underline mb-3 no-underline"
        >
          <ArrowLeft size={14} /> {t('citizen.back_to_dashboard', 'Back to Overview')}
        </Link>
        <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight">
          {t('citizen.submit_a_petition', 'Submit a Civic Grievance')}
        </h1>
        <p className="text-[#68716B] text-sm mt-1 leading-relaxed">
          {t('citizen.submit_petition_desc', 'Describe your concern clearly. Our system will automatically categorise, prioritise, and route it to the appropriate state ministry.')}
        </p>
      </div>

      <div className="bg-[#EFF4F0] rounded-2xl border border-[#D4E2D8] p-4 flex items-center gap-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#315C4A] border border-[#D4E2D8] flex-shrink-0">
          <Shield size={16} />
        </div>
        <p className="text-xs text-[#202522] leading-snug">
          <strong className="text-[#315C4A] font-semibold">InsightGov Intelligence:</strong> Your application will be analysed upon submission, establishing geospatial coordinates and routing directly to the corresponding ministry queue.
        </p>
      </div>

      <PetitionForm />
    </div>
  );
}
