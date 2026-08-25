import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useWithdrawPetition } from '@/hooks/usePetitions';
import { getImageUrl } from '@/api/petitions.api';
import ImageGallery from '@/components/petition/ImageGallery';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, MapPin, Calendar, Loader2, Clock, AlertTriangle, X, Image as ImageIcon, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

// ── Withdraw Modal ──────────────────────────────────────────────────────────
// ── Withdraw Modal ──────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-bold text-foreground">{t('citizen.withdraw_petition', 'Withdraw Petition')}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground rounded-full p-1">
            <X size={18} />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>"{petition.title}"</strong> {t('citizen.withdraw_confirm', 'will be permanently withdrawn. This action cannot be undone.')}
        </div>

        <div>
          <label className="form-label">{t('citizen.reason_label', 'Reason for withdrawal *')}</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder={t('citizen.reason_placeholder', 'e.g. The issue has been resolved by local authorities.')}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel', 'Cancel')}</button>
          <button
            onClick={handleWithdraw}
            disabled={isPending || reason.trim().length < 5}
            className="flex-1 btn bg-amber-600 hover:bg-amber-700 text-white shadow-sm disabled:opacity-60"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : t('citizen.confirm_withdrawal', 'Confirm Withdrawal')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function PetitionStatus() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: petition, isLoading, isError } = usePetition(id);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  usePageTitle(petition ? `${t('citizen.track_status', 'Track Status')} - ${petition.title}` : t('common.loading', 'Loading...'));

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
        <p className="text-muted-foreground">Petition not found.</p>
        <Link to="/citizen/dashboard" className="btn-secondary mt-4">Back to Dashboard</Link>
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

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to="/citizen/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 no-underline">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{petition.title}</h1>
            <div className="flex items-center gap-2">
              {analysis?.priority && <PriorityBadge priority={analysis.priority} size="lg" />}
              {canWithdraw && (
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  Withdraw Petition
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {petition.location}
              {petition.location_verification_status === 'VERIFIED' && <ShieldCheck size={13} className="text-emerald-500 ml-1" title="Location Verified" />}
              {petition.location_verification_status === 'MISMATCH' && <ShieldAlert size={13} className="text-amber-500 ml-1" title="Location Requires Review" />}
              {(petition.location_verification_status === 'UNAVAILABLE' || petition.location_verification_status === 'unverified') && <Shield size={13} className="text-muted-foreground/50 ml-1" title="Location Unavailable" />}
            </span>
            <span className="flex items-center gap-1"><Calendar size={13} /> {formatDateShort(petition.created_at)}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> ID: <code className="font-mono text-xs">{petition.petition_number}</code></span>
          </div>
        </div>

        {/* Withdrawn banner */}
        {petition.status === 'withdrawn' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
            <div>
              <strong>This petition has been withdrawn.</strong>
              {petition.withdrawal_reason && (
                <p className="mt-0.5 text-amber-700">Reason: {petition.withdrawal_reason}</p>
              )}
            </div>
          </div>
        )}

        {/* Petition body */}
        <div className="card">
          <h2 className="section-title">Petition Details</h2>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{petition.description}</p>
        </div>

        {/* Attached images */}
        {petition.images?.filter(img => img.image_type === 'petition').length > 0 && (
          <div className="card">
            <ImageGallery images={petition.images.filter(img => img.image_type === 'petition')} />
          </div>
        )}

        {/* Resolution Proof */}
        {petition.images?.filter(img => img.image_type === 'resolution').length > 0 && (
          <div className="card">
            <ImageGallery 
              images={petition.images.filter(img => img.image_type === 'resolution')} 
              title="Resolution Proof"
            />
          </div>
        )}

        {/* AI Analysis (read-only for citizens) */}
        {petition.status !== 'pending' && petition.status !== 'withdrawn' && (
          <div>
            <h2 className="section-title">AI Analysis</h2>
            <AIAnalysisPanel analysis={analysis} role="citizen" showOverride={false} petition={petition} />
          </div>
        )}

        {petition.status === 'pending' && (
          <div className="card flex items-center gap-3 text-muted-foreground">
            <Loader2 size={18} className="animate-spin text-primary-400" />
            <span className="text-sm">AI analysis in progress… This usually takes less than 30 seconds.</span>
          </div>
        )}

        {/* Status timeline */}
        <div>
          <h2 className="section-title">Status History</h2>
          <div className="card">
            <StatusTimeline history={petition.history ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}
