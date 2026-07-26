import { useParams, Link } from 'react-router-dom';
import { usePetition } from '@/hooks/usePetitions';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { formatDate, formatDateShort } from '@/lib/utils';
import { ArrowLeft, MapPin, Calendar, Loader2, Clock } from 'lucide-react';

export default function PetitionStatus() {
  const { id } = useParams();
  const { data: petition, isLoading, isError } = usePetition(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-400" />
      </div>
    );
  }

  if (isError || !petition) {
    return (
      <div className="card text-center py-14">
        <p className="text-slate-500">Petition not found.</p>
        <Link to="/citizen/dashboard" className="btn-secondary mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  const analysis = petition.ai_analysis;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link to="/citizen/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 no-underline">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{petition.title}</h1>
          {analysis?.priority && <PriorityBadge priority={analysis.priority} size="lg" />}
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
          <span className="flex items-center gap-1"><MapPin size={13} /> {petition.location}</span>
          <span className="flex items-center gap-1"><Calendar size={13} /> {formatDateShort(petition.created_at)}</span>
          <span className="flex items-center gap-1"><Clock size={13} /> ID: <code className="font-mono text-xs">{petition.id}</code></span>
        </div>
      </div>

      {/* Petition body */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Petition Details</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{petition.description}</p>
      </div>

      {/* AI Analysis (read-only for citizens) */}
      {petition.status !== 'pending' && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">AI Analysis</h2>
          <AIAnalysisPanel analysis={analysis} role="citizen" showOverride={false} />
        </div>
      )}

      {petition.status === 'pending' && (
        <div className="card flex items-center gap-3 text-slate-500">
          <Loader2 size={18} className="animate-spin text-primary-400" />
          <span className="text-sm">AI analysis in progress… This usually takes less than 30 seconds.</span>
        </div>
      )}

      {/* Status timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Status History</h2>
        <div className="card">
          <StatusTimeline history={petition.history ?? []} />
        </div>
      </div>
    </div>
  );
}
