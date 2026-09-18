import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useWithdrawPetition } from '@/hooks/usePetitions';
import ImageGallery from '@/components/petition/ImageGallery';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, MapPin, Calendar, Loader2, AlertTriangle, X } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

function WithdrawModal({ petition, onClose }) {
  const { t } = useTranslation();
  const { mutateAsync: withdraw, isPending } = useWithdrawPetition();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    if (reason.trim().length < 5) {
      setError('Please provide a reason (minimum 5 characters).');
      return;
    }
    try {
      await withdraw({ id: petition.id, reason: reason.trim() });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to withdraw application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181817]/60 backdrop-blur-xs animate-fade-in p-4">
      <div className="bg-white rounded-md border border-[#DDDCD7] w-full max-w-md p-6 space-y-4 shadow-elevated">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[#E13B22]">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181817]">Withdraw Application</h2>
          </div>
          <button onClick={onClose} className="text-[#6F6F6A] hover:text-[#181817] p-1">
            <X size={16} />
          </button>
        </div>

        <div className="bg-[#FFF0EB] border border-[#F05A3C]/30 rounded p-3 text-xs text-[#E13B22] leading-relaxed">
          <strong>"{petition.title}"</strong> will be marked as withdrawn from the administrative docket.
        </div>

        <div>
          <label className="form-label">Reason for Withdrawal *</label>
          <textarea
            className="form-input resize-none text-xs"
            rows={3}
            placeholder="e.g. Issue resolved on-site."
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-[#E13B22] mt-1 font-mono">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-xs">Cancel</button>
          <button
            onClick={handleWithdraw}
            disabled={isPending || reason.trim().length < 5}
            className="flex-1 btn-primary text-xs bg-[#E13B22] hover:bg-[#b91c1c] text-white disabled:opacity-50"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : 'Confirm Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PetitionStatus() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: petition, isLoading, isError } = usePetition(id);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  usePageTitle(petition ? `Case File - ${petition.petition_number}` : 'Case File');

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#181817]" />
      </div>
    );
  }

  if (isError || !petition) {
    return (
      <div className="bg-white rounded-md border border-[#DDDCD7] p-16 text-center text-[#6F6F6A]">
        <p className="font-mono text-xs">CASE FILE RECORD NOT FOUND.</p>
        <Link to="/citizen/dashboard" className="btn-secondary mt-4 inline-flex text-xs">Back to Overview</Link>
      </div>
    );
  }

  const analysis = petition.ai_analysis;
  const canWithdraw = ['pending', 'analysed'].includes(petition.status);

  return (
    <>
      {showWithdraw && (
        <WithdrawModal petition={petition} onClose={() => setShowWithdraw(false)} />
      )}

      <div className="space-y-8 pb-16">
        {/* Navigation Link */}
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#181817] hover:text-[#F05A3C] transition-colors no-underline"
        >
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Digital Case File Header Docket */}
        <div className="border-b border-[#DDDCD7] pb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold text-[#F05A3C] uppercase tracking-wider">
                  APPLICATION #{petition.petition_number}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#181817] text-white">
                  {petition.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#181817] uppercase tracking-tight">
                {petition.title}
              </h1>
              <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
                {petition.department_name || analysis?.department || 'Department Triage in progress'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {analysis?.priority && <PriorityBadge priority={analysis.priority} size="md" />}
              {canWithdraw && (
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="btn-secondary text-xs text-[#E13B22] border-[#DDDCD7] hover:border-[#E13B22]"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 mt-6 border-t border-[#DDDCD7] text-xs">
            <div>
              <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Department Jurisdiction</p>
              <p className="font-bold text-[#181817] mt-0.5">{petition.department_name || analysis?.department || 'Pending'}</p>
            </div>
            <div>
              <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Filing Timestamp</p>
              <p className="font-bold text-[#181817] font-mono mt-0.5">{formatDateShort(petition.created_at)}</p>
            </div>
            <div>
              <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Location</p>
              <p className="font-bold text-[#181817] truncate mt-0.5">{petition.location || 'Unspecified'}</p>
            </div>
            <div>
              <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Resolution SLA</p>
              <p className="font-bold text-[#181817] font-mono mt-0.5">Standard 7-Day</p>
            </div>
          </div>
        </div>

        {/* Two-Column Digital Case File Docket */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Statement, Documents, Evidence */}
          <div className="lg:col-span-7 space-y-6">
            {/* Grievance Statement */}
            <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6F6F6A] block mb-3 border-b border-[#DDDCD7] pb-2">
                APPLICATION DETAILS & STATEMENT
              </span>
              <p className="text-[#181817] leading-relaxed text-xs whitespace-pre-wrap">
                {petition.description}
              </p>
            </div>

            {/* Attached Evidence Photos */}
            {petition.images?.filter(img => img.image_type === 'petition').length > 0 && (
              <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6F6F6A] block mb-3 border-b border-[#DDDCD7] pb-2">
                  ATTACHED EVIDENCE DOCUMENTS
                </span>
                <ImageGallery images={petition.images.filter(img => img.image_type === 'petition')} />
              </div>
            )}

            {/* Resolution Proof */}
            {petition.images?.filter(img => img.image_type === 'resolution').length > 0 && (
              <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-3 border-b border-[#DDDCD7] pb-2">
                  OFFICIAL RESOLUTION PROOF
                </span>
                <ImageGallery 
                  images={petition.images.filter(img => img.image_type === 'resolution')} 
                  title="Official Resolution Proof"
                />
              </div>
            )}

            {/* Withdrawn Notice */}
            {petition.status === 'withdrawn' && (
              <div className="rounded-md border border-[#E13B22]/30 bg-[#FFF0EB] p-4 text-xs text-[#E13B22]">
                <strong className="block mb-1 font-mono uppercase">Case File Withdrawn</strong>
                {petition.withdrawal_reason && (
                  <p>Stated Reason: {petition.withdrawal_reason}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Review Timeline & Intelligence */}
          <div className="lg:col-span-5 space-y-6">
            {/* Review Timeline */}
            <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6F6F6A] block mb-4 border-b border-[#DDDCD7] pb-2">
                REVIEW TIMELINE
              </span>
              <StatusTimeline history={petition.history ?? []} />
            </div>

            {/* AI Intelligence Panel */}
            {petition.status !== 'pending' && petition.status !== 'withdrawn' && (
              <AIAnalysisPanel analysis={analysis} role="citizen" showOverride={false} petition={petition} />
            )}

            {petition.status === 'pending' && (
              <div className="bg-[#181817] text-[#F7F6F2] rounded-md border border-[#292927] p-5 text-xs font-mono flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-[#F05A3C] flex-shrink-0" />
                <span>Autonomous triage in progress — categorizing grievance and checking cluster duplicates.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
