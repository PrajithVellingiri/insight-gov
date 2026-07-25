import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmitPetition } from '@/hooks/usePetitions';
import { MapPin, FileText, Type, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PetitionForm() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useSubmitPetition();

  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 30) errs.description = 'Please provide more detail (min 30 characters)';
    if (!form.location.trim()) errs.location = 'Location is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      const data = await mutateAsync(form);
      setSubmitted(data);
    } catch (err) {
      setErrors({ submit: err?.response?.data?.detail || 'Submission failed. Please try again.' });
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  if (submitted) {
    return (
      <div className="card text-center py-10 animate-fade-in">
        <CheckCircle size={48} className="text-accent-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Petition Submitted!</h2>
        <p className="text-slate-500 mb-1">Your petition has been received and is being analysed by our AI system.</p>
        <p className="text-xs text-slate-400 mb-6">Reference ID: <span className="font-mono font-semibold text-slate-700">{submitted.id}</span></p>
        <div className="flex justify-center gap-3">
          <button className="btn-secondary" onClick={() => navigate('/citizen/dashboard')}>Go to Dashboard</button>
          <button className="btn-primary" onClick={() => navigate(`/citizen/petitions/${submitted.id}`)}>Track Status</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="pet-title" className="form-label">
          <Type size={13} className="inline mr-1" /> Petition Title *
        </label>
        <input
          id="pet-title"
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder="Brief title describing your concern"
          className={cn('form-input', errors.title && 'border-red-400 focus:ring-red-400/20')}
        />
        {errors.title && <p className="form-error"><span>{errors.title}</span></p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="pet-desc" className="form-label">
          <FileText size={13} className="inline mr-1" /> Description *
        </label>
        <textarea
          id="pet-desc"
          rows={5}
          value={form.description}
          onChange={set('description')}
          placeholder="Describe your issue in detail — what happened, who is affected, how long it has been going on..."
          className={cn('form-input resize-none', errors.description && 'border-red-400')}
        />
        <div className="flex justify-between mt-1">
          {errors.description
            ? <p className="form-error">{errors.description}</p>
            : <span />}
          <span className="text-xs text-slate-400">{form.description.length} chars</span>
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="pet-loc" className="form-label">
          <MapPin size={13} className="inline mr-1" /> Location *
        </label>
        <input
          id="pet-loc"
          type="text"
          value={form.location}
          onChange={set('location')}
          placeholder="e.g. MG Road, Gandhi Nagar, Delhi"
          className={cn('form-input', errors.location && 'border-red-400')}
        />
        {errors.location && <p className="form-error">{errors.location}</p>}
      </div>

      {errors.submit && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400">* All fields are required</p>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Submit Petition'}
        </button>
      </div>
    </form>
  );
}
