import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useWithdrawPetition } from '@/hooks/usePetitions';
import ImageGallery from '@/components/petition/ImageGallery';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, MapPin, Calendar, Loader2, Clock, AlertTriangle, X, Image as ImageIcon, ShieldCheck, ShieldAlert, Shield, Sparkles, FileText } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="glass-panel-elevated rounded-3xl border border-amber-500/30 w-full max-w-md p-6 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-400">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-bold text-foreground">{t('citizen.withdraw_petition', 'Withdraw Grievance')}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-xl p-1 hover:bg-slate-800/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-xs text-amber-300 leading-relaxed">
          <strong>"{petition.title}"</strong> {t('citizen.withdraw_confirm', 'will be permanently marked as withdrawn. This administrative action cannot be undone.')}
        </div>

        <div>
          <label className="form-label">{t('citizen.reason_label', 'Official Reason for Withdrawal *')}</label>
          <textarea
            className="form-input resize-none text-xs"
            rows={3}
            placeholder={t('citizen.reason_placeholder', 'e.g. Issue resolved on-site by municipal workers.')}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-xs">{t('common.cancel', 'Cancel')}</button>
          <button
            onClick={handleWithdraw}
            disabled={isPending || reason.trim().length < 5}
            className="flex-1 btn text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
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
        <Loader2 size={36} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (isError || !petition) {
    return (
      <div className="card text-center py-16 text-muted-foreground">
        <p>Petition record not found.</p>
        <Link to="/citizen/dashboard" className="btn-secondary mt-4 inline-flex">Back to Dashboard</Link>
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

      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div>
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 mb-3 no-underline transition-colors"
          >
            <ArrowLeft size={14} /> Back to My Petitions
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {petition.petition_number}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 uppercase tracking-wider">
                  {petition.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
                {petition.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {analysis?.priority && <PriorityBadge priority={analysis.priority} size="lg" />}
              {canWithdraw && (
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  Withdraw Grievance
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-400" /> {petition.location}
              {petition.location_verification_status === 'VERIFIED' && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold inline-flex items-center gap-0.5">
                  <ShieldCheck size={11} /> GPS Verified
                </span>
              )}
              {petition.location_verification_status === 'MISMATCH' && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-semibold inline-flex items-center gap-0.5">
                  <ShieldAlert size={11} /> Review Flag
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar size={12} className="text-muted-foreground" /> {formatDateShort(petition.created_at)}
            </span>
          </div>
        </div>

        {/* Withdrawn banner */}
        {petition.status === 'withdrawn' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
            <div>
              <strong className="text-sm font-bold text-amber-400 block mb-0.5">Petition Formally Withdrawn</strong>
              {petition.withdrawal_reason && (
                <p className="text-slate-300">Stated Reason: {petition.withdrawal_reason}</p>
              )}
            </div>
          </div>
        )}

        {/* Petition body */}
        <div className="card space-y-2">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/60">
            <FileText size={16} className="text-blue-400" />
            <h2 className="section-title !mb-0">Petition Statement</h2>
          </div>
          <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap font-normal">
            {petition.description}
          </p>
        </div>

        {/* Attached images */}
        {petition.images?.filter(img => img.image_type === 'petition').length > 0 && (
          <div className="card">
            <ImageGallery images={petition.images.filter(img => img.image_type === 'petition')} />
          </div>
        )}

        {/* Resolution Proof */}
        {petition.images?.filter(img => img.image_type === 'resolution').length > 0 && (
          <div className="card border-emerald-500/25 bg-emerald-950/10">
            <ImageGallery 
              images={petition.images.filter(img => img.image_type === 'resolution')} 
              title="Official Resolution Proof"
            />
          </div>
        )}

        {/* AI Analysis (read-only for citizens) */}
        {petition.status !== 'pending' && petition.status !== 'withdrawn' && (
          <div>
            <h2 className="section-title">Autonomous AI Determination</h2>
            <AIAnalysisPanel analysis={analysis} role="citizen" showOverride={false} petition={petition} />
          </div>
        )}

        {petition.status === 'pending' && (
          <div className="card flex items-center gap-3.5 text-muted-foreground p-5">
            <Loader2 size={20} className="animate-spin text-blue-400 flex-shrink-0" />
            <span className="text-xs leading-relaxed text-slate-300">
              Autonomous AI triage in progress… Analysing grievance context, checking geospatial vector clustering, and routing to state ministry.
            </span>
          </div>
        )}

        {/* Status timeline */}
        <div>
          <h2 className="section-title">Grievance Lifecycle Milestones</h2>
          <div className="card">
            <StatusTimeline history={petition.history ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}
