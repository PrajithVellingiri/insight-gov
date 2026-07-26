import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmitPetition } from '@/hooks/usePetitions';
import { MapPin, FileText, Type, Loader2, CheckCircle, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function PetitionForm() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useSubmitPetition();

  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [position, setPosition] = useState(null); // { lat, lng }
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 30) errs.description = 'Please provide more detail (min 30 characters)';
    if (!form.location.trim()) errs.location = 'Location description is required';
    if (!position) errs.position = 'Please pin the exact location on the map';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      const payload = {
        ...form,
        latitude: position.lat,
        longitude: position.lng
      };
      const data = await mutateAsync(payload);
      setSubmitted(data);
    } catch (err) {
      setErrors({ submit: err?.response?.data?.detail || 'Submission failed. Please try again.' });
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // Default to a central point in India if geolocation isn't ready
  const defaultCenter = [11.1271, 78.6569]; // Tamil Nadu center approx

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
          {errors.description ? <p className="form-error">{errors.description}</p> : <span />}
          <span className="text-xs text-slate-400">{form.description.length} chars</span>
        </div>
      </div>

      {/* Location Text */}
      <div>
        <label htmlFor="pet-loc" className="form-label">
          <MapPin size={13} className="inline mr-1" /> Location Description *
        </label>
        <input
          id="pet-loc"
          type="text"
          value={form.location}
          onChange={set('location')}
          placeholder="e.g. MG Road, Gandhi Nagar, Chennai"
          className={cn('form-input', errors.location && 'border-red-400')}
        />
        {errors.location && <p className="form-error">{errors.location}</p>}
      </div>

      {/* Location Map Pin */}
      <div>
        <label className="form-label mb-2 block">
          <Navigation size={13} className="inline mr-1" /> Pin Exact Location on Map *
        </label>
        <div className={cn("h-64 w-full rounded-xl overflow-hidden border", errors.position ? "border-red-400" : "border-slate-200")}>
          <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">Click anywhere on the map to drop a pin.</p>
        {errors.position && <p className="form-error mt-1">{errors.position}</p>}
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
