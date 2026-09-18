import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import PetitionForm from '@/components/petition/PetitionForm';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function SubmitPetition() {
  const { t } = useTranslation();
  usePageTitle('Submit Application');

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#181817] hover:text-[#F05A3C] transition-colors mb-3 no-underline"
        >
          <ArrowLeft size={13} /> Return to Dashboard
        </Link>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-1">
          CITIZEN GRIEVANCE INTAKE
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181817] uppercase tracking-tight">
          Submit Application
        </h1>
        <p className="text-[#6F6F6A] text-xs sm:text-sm mt-1 leading-relaxed">
          Record your grievance in the state ledger. Our intelligence layer will automatically categorize, check spatial duplicates, and route it to the responsible department.
        </p>
      </div>

      <div className="bg-[#181817] text-[#F7F6F2] rounded-md border border-[#292927] p-4 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#F05A3C] flex-shrink-0" />
        <p className="text-xs font-mono leading-snug">
          <strong className="text-[#F05A3C]">INSIGHTGOV INTAKE:</strong> Applications undergo sub-second embedding extraction and geospatial coordinate deduplication.
        </p>
      </div>

      <PetitionForm />
    </div>
  );
}
