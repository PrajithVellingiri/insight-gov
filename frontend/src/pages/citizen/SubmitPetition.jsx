import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PetitionForm from '@/components/petition/PetitionForm';

export default function SubmitPetition() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <Link to="/citizen/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 no-underline">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Submit a Petition</h1>
          <p className="text-slate-500 text-sm mt-1">
            Describe your concern clearly. Our AI will automatically categorise, prioritise, and route it to the right department.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-primary-50 border border-primary-100 px-4 py-3 text-sm text-primary-700">
        🧠 Your petition will be analysed by AI within seconds of submission.
      </div>

      <PetitionForm />
    </div>
  );
}
