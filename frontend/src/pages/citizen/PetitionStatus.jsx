import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useWithdrawPetition } from '@/hooks/usePetitions';
import ImageGallery from '@/components/petition/ImageGallery';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, MapPin, Calendar, Loader2, AlertTriangle, X, Shield, FileText } from 'lucide-react';
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
      setError(err?.response?.data?.detail || t('citizen.error_withdraw', 'Failed to withdraw petition. Please try again.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202522]/40 backdrop-blur-xs animate-fade-in p-4">
      <div className="bg-white rounded-2xl border border-[#E5E5DE] w-full max-w-md p-6 space-y-4 shadow-dropdown">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[#C58B5B]">
            <AlertTriangle size={18} />
            <h2 className="text-base font-bold text-[#202522]">{t('citizen.withdraw_petition', 'Withdraw Petition')}</h2>
          </div>
          <button onClick={onClose} className="text-[#68716B] hover:text-[#202522] rounded-lg p-1">
            <X size={16} />
          </button>
        </div>

        <div className="bg-[#FDF6F0] border border-[#F2DFD0] rounded-xl px-4 py-3 text-xs text-[#C58B5B] leading-relaxed">
          <strong>"{petition.title}"</strong> {t('citizen.withdraw_confirm', 'will be marked as withdrawn. This administrative action cannot be undone.')}
        </div>

        <div>
          <label className="form-label">{t('citizen.reason_label', 'Reason for Withdrawal *')}</label>
          <textarea
            className="form-input resize-none text-xs"
            rows={3}
            placeholder={t('citizen.reason_placeholder', 'e.g. Issue resolved on-site by municipal workers.')}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-[#b91c1c] mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-xs">{t('common.cancel', 'Cancel')}</button>
          <button
            onClick={handleWithdraw}
            disabled={isPending || reason.trim().length < 5}
            className="flex-1 btn-danger text-xs font-medium disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : t('citizen.confirm_withdrawal', 'Confirm Withdrawal')}
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
  
  usePageTitle(petition ? `${t('citizen.track_status', 'Track Status')} - ${petition.title}` : t('common.loading', 'Loading...'));

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[#315C4A]" />
      </div>
    );
  }

  if (isError || !petition) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5DE] p-16 text-center text-[#68716B]">
        <p>Petition record not found.</p>
        <Link to="/citizen/dashboard" className="btn-secondary mt-4 inline-flex">Back to Overview</Link>
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

      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Case File Header */}
        <div>
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C4A] hover:underline mb-4 no-underline"
          >
            <ArrowLeft size={14} /> Back to Overview
          </Link>

          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 sm:p-8 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E5E5DE]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-[#68716B] bg-[#F8F7F2] px-2.5 py-0.5 rounded border border-[#E5E5DE]">
                    {petition.petition_number}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-[#EFF4F0] text-[#315C4A] border-[#D4E2D8]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#315C4A]" />
                    {petition.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202522] tracking-tight">
                  {petition.title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {analysis?.priority && <PriorityBadge priority={analysis.priority} size="md" />}
                {canWithdraw && (
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="btn-secondary text-xs text-[#C58B5B] hover:text-[#b91c1c]"
                  >
                    Withdraw Petition
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 text-xs">
              <div>
                <p className="font-mono uppercase tracking-wider text-[#68716B] text-[10px] mb-1">Assigned Ministry</p>
                <p className="font-semibold text-[#202522]">{petition.department_name || analysis?.department || 'Triage in progress'}</p>
              </div>

              <div>
                <p className="font-mono uppercase tracking-wider text-[#68716B] text-[10px] mb-1">Filed Date</p>
                <p className="font-semibold text-[#202522] font-mono">{formatDateShort(petition.created_at)}</p>
              </div>

              <div>
                <p className="font-mono uppercase tracking-wider text-[#68716B] text-[10px] mb-1">Location</p>
                <p className="font-semibold text-[#202522] flex items-center gap-1">
                  <MapPin size={12} className="text-[#315C4A]" />
                  <span className="truncate">{petition.location}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawn Notice */}
        {petition.status === 'withdrawn' && (
          <div className="rounded-2xl border border-[#F2DFD0] bg-[#FDF6F0] p-4 text-xs text-[#C58B5B] flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-xs font-bold block mb-0.5">Petition Formally Withdrawn</strong>
              {petition.withdrawal_reason && (
                <p className="text-[#68716B]">Stated Reason: {petition.withdrawal_reason}</p>
              )}
            </div>
          </div>
        )}

        {/* Petition Statement */}
        <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 sm:p-8 shadow-card">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-2">
            GRIEVANCE STATEMENT
          </span>
          <p className="text-[#202522] leading-relaxed text-sm whitespace-pre-wrap">
            {petition.description}
          </p>
        </div>

        {/* Evidence Images */}
        {petition.images?.filter(img => img.image_type === 'petition').length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 shadow-card">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-4">
              ATTACHED EVIDENCE PHOTOS
            </span>
            <ImageGallery images={petition.images.filter(img => img.image_type === 'petition')} />
          </div>
        )}

        {/* Resolution Proof */}
        {petition.images?.filter(img => img.image_type === 'resolution').length > 0 && (
          <div className="bg-[#EFF4F0] rounded-2xl border border-[#D4E2D8] p-6">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#315C4A] block mb-4">
              OFFICIAL RESOLUTION PROOF
            </span>
            <ImageGallery 
              images={petition.images.filter(img => img.image_type === 'resolution')} 
              title="Official Resolution Proof"
            />
          </div>
        )}

        {/* InsightGov Intelligence Section */}
        {petition.status !== 'pending' && petition.status !== 'withdrawn' && (
          <AIAnalysisPanel analysis={analysis} role="citizen" showOverride={false} petition={petition} />
        )}

        {petition.status === 'pending' && (
          <div className="bg-[#EFF4F0] rounded-2xl border border-[#D4E2D8] p-5 flex items-center gap-3 text-xs text-[#315C4A]">
            <Loader2 size={16} className="animate-spin flex-shrink-0" />
            <span>
              Autonomous triage in progress — categorizing grievance, checking cluster duplicates, and routing to the responsible ministry.
            </span>
          </div>
        )}

        {/* Audit Milestones Timeline */}
        <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 sm:p-8 shadow-card">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-6">
            CASE FILE AUDIT MILESTONES
          </span>
          <StatusTimeline history={petition.history ?? []} />
        </div>
      </div>
    </>
  );
}
