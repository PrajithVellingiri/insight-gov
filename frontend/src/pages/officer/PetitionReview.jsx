import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useUpdatePetition } from '@/hooks/usePetitions';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import PetitionMap from '@/components/map/PetitionMap';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Loader2, MapPin, Calendar, Clock, Edit3, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PetitionReview() {
  const { id } = useParams();
  const { data: petition, isLoading } = usePetition(id);
  const { mutateAsync: update, isPending: updateLoading } = useUpdatePetition();

  const [overrideMode, setOverrideMode] = useState(false);
  const [form, setForm] = useState({ department: '', priority: '', notes: '' });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>;
  }

  if (!petition) {
    return <div className="card text-center py-14">Petition not found.</div>;
  }

  const analysis = petition.ai_analysis;

  const handleAction = async (status) => {
    try {
      const payload = { status, notes: form.notes };
      if (overrideMode) {
        if (form.department) payload.department = form.department;
        if (form.priority) payload.priority = form.priority;
      }
      await update({ id, data: payload });
      setOverrideMode(false);
      setForm({ department: '', priority: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to update petition.');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* Left Column: Details & Map */}
      <div className="xl:col-span-2 space-y-6">
        <div>
          <Link to="/officer/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 no-underline">
            <ArrowLeft size={14} /> Back to Queue
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{petition.title}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1"><MapPin size={13} /> {petition.location}</span>
            <span className="flex items-center gap-1"><Calendar size={13} /> {formatDateShort(petition.created_at)}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> ID: <code className="font-mono text-xs">{petition.id}</code></span>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Petition Details</h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{petition.description}</p>
        </div>

        <div className="card p-1 pb-2">
          <div className="px-4 pt-3 pb-2"><h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Location</h2></div>
          <PetitionMap petitions={[petition]} height={300} role="officer" />
        </div>
      </div>

      {/* Right Column: AI & Actions */}
      <div className="space-y-6">
        <AIAnalysisPanel analysis={analysis} role="officer" />

        {/* Officer Action Panel */}
        <div className="card border-primary-200 shadow-md">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Edit3 size={16} className="text-primary-600" /> Officer Decision
          </h2>

          {overrideMode ? (
            <div className="space-y-4 animate-fade-in bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <div>
                <label className="form-label">Override Department</label>
                <select className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Keep AI Suggestion ({analysis?.department})</option>
                  <option value="Public Works Department">Public Works Department</option>
                  <option value="Water Supply and Sanitation Department">Water Supply and Sanitation Department</option>
                  <option value="Department of Police">Department of Police</option>
                </select>
              </div>
              <div>
                <label className="form-label">Override Priority</label>
                <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="">Keep AI Suggestion ({analysis?.priority})</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button onClick={() => setOverrideMode(false)} className="text-xs text-slate-500 hover:text-slate-700 underline">Cancel Override</button>
            </div>
          ) : (
            <div className="mb-4">
              <button onClick={() => setOverrideMode(true)} className="text-sm text-primary-600 hover:text-primary-800 underline font-medium">
                Override AI Suggestions
              </button>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <label className="form-label">Action Notes (visible to citizen)</label>
            <textarea
              className="form-input resize-none" rows={3}
              placeholder="e.g. Team dispatched to location."
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAction('resolved')} disabled={updateLoading} className="btn bg-accent-600 hover:bg-accent-700 text-white shadow-sm">
              <CheckCircle size={14} /> Resolve
            </button>
            <button onClick={() => handleAction('rejected')} disabled={updateLoading} className="btn bg-white border border-slate-200 text-red-600 hover:bg-red-50 shadow-sm">
              <XCircle size={14} /> Reject
            </button>
            <button onClick={() => handleAction('duplicate')} disabled={updateLoading} className="btn-secondary col-span-2">
              Mark as Duplicate
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Status History</h2>
          <StatusTimeline history={petition.history ?? []} />
        </div>
      </div>
    </div>
  );
}
