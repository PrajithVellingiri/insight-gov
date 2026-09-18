import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmitPetition } from '@/hooks/usePetitions';
import { getDepartments } from '@/api/petitions.api';
import {
  MapPin, FileText, Type, Loader2, CheckCircle, Navigation,
  Image as ImageIcon, X, LocateFixed, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MicButton from '@/components/ui/MicButton';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

function LocationPicker({ position, setPosition, setLocationSource, setLocationAccuracy }) {
  useMapEvents({
    click(e) {
      const wrapped = e.latlng.wrap();
      setPosition({ lat: wrapped.lat, lng: wrapped.lng });
      setLocationSource('manual');
      setLocationAccuracy(null);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function MapController({ flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], 16, { animate: true, duration: 1.2 });
    }
  }, [flyTo, map]);
  return null;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

export default function PetitionForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useSubmitPetition();

  const [form, setForm] = useState({ title: '', description: '', location: '', citizen_department_id: '' });
  const [departments, setDepartments] = useState([]);
  const [position, setPosition] = useState(null);
  const [locationSource, setLocationSource] = useState('manual');
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 30) errs.description = 'Please provide more detail (min 30 characters)';
    if (!form.location.trim()) errs.location = 'Location description is required';
    if (!position) errs.position = 'Please pin the exact location on the map';
    if (images.length === 0) errs.images = 'Please attach at least one photo (mandatory)';
    return errs;
  };

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy } = coords;
        setPosition({ lat, lng });
        setLocationSource('gps');
        setLocationAccuracy(accuracy);
        setFlyTo({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
            { headers: { 'User-Agent': 'InsightGov/1.0' } },
          );
          const data = await res.json();
          if (data?.display_name) {
            setForm((prev) => ({ ...prev, location: data.display_name }));
          }
        } catch {
          // ignore reverse geocode fail
        }

        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Click the map to pin manually.');
        } else {
          setGpsError('Unable to detect location. Click the map to pin manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const badType = selected.find((f) => !ALLOWED_MIME.includes(f.type));
    if (badType) {
      setErrors((prev) => ({ ...prev, images: 'Only JPG, PNG, and WebP images are allowed.' }));
      return;
    }
    const tooBig = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setErrors((prev) => ({ ...prev, images: 'Each image must be under 5 MB.' }));
      return;
    }
    if (images.length + selected.length > MAX_FILES) {
      setErrors((prev) => ({ ...prev, images: `Maximum ${MAX_FILES} images allowed.` }));
      return;
    }

    const newFiles = [...images, ...selected];
    const newPreviews = [...previews, ...selected.map((f) => URL.createObjectURL(f))];
    setImages(newFiles);
    setPreviews(newPreviews);
    setErrors((prev) => ({ ...prev, images: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const requestDeviceLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setGpsLoading(true);
    const deviceLoc = await requestDeviceLocation();
    setGpsLoading(false);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('latitude', position.lat);
      formData.append('longitude', position.lng);
      formData.append('location_source', locationSource);
      if (locationAccuracy !== null) {
        formData.append('location_accuracy', locationAccuracy);
      }
      if (deviceLoc) {
        formData.append('device_latitude', deviceLoc.lat);
        formData.append('device_longitude', deviceLoc.lng);
        formData.append('device_accuracy', deviceLoc.acc);
      }
      if (form.citizen_department_id) {
        formData.append('citizen_department_id', form.citizen_department_id);
      }
      images.forEach((file) => formData.append('files', file));

      const data = await mutateAsync(formData);
      setSubmitted(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let errMsg = 'Submission failed. Please try again.';
      if (Array.isArray(detail)) {
        errMsg = detail.map(d => `${d.loc.slice(-1)[0]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        errMsg = detail;
      }
      setErrors({ submit: errMsg });
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const defaultCenter = [11.1271, 78.6569];

  if (submitted) {
    return (
      <div className="bg-white rounded-md border border-[#DDDCD7] text-center p-8 sm:p-12 shadow-card space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#181817] text-white flex items-center justify-center mx-auto mb-2">
          <CheckCircle size={24} />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#181817]">Application Recorded</h2>
        <p className="text-xs text-[#6F6F6A] max-w-md mx-auto">
          Your grievance has been recorded in the state ledger and is currently undergoing autonomous triage and classification.
        </p>
        <p className="text-xs font-mono text-[#6F6F6A]">
          Reference ID: <span className="font-bold text-[#181817]">#{submitted.id}</span>
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <button className="btn-secondary text-xs px-4" onClick={() => navigate('/citizen/dashboard')}>
            Return to Overview
          </button>
          <button className="btn-primary text-xs px-4" onClick={() => navigate(`/citizen/petitions/${submitted.id}`)}>
            Inspect Case File
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-md border border-[#DDDCD7] p-6 sm:p-8 space-y-5 shadow-card">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="pet-title" className="form-label mb-0">
            <Type size={13} className="inline mr-1" /> Application Title *
          </label>
          <MicButton 
            onTranscript={(text) => setForm(p => ({ ...p, title: p.title + (p.title && !p.title.endsWith(' ') ? ' ' : '') + text }))} 
            language={i18n.language} 
          />
        </div>
        <input
          id="pet-title"
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder="Concise summary describing the public issue"
          className={cn('form-input', errors.title && 'border-[#E13B22]')}
        />
        {errors.title && <p className="text-[11px] font-mono text-[#E13B22] mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="pet-desc" className="form-label mb-0">
            <FileText size={13} className="inline mr-1" /> Factual Statement *
          </label>
          <MicButton 
            onTranscript={(text) => setForm(p => ({ ...p, description: p.description + (p.description && !p.description.endsWith(' ') ? ' ' : '') + text }))} 
            language={i18n.language} 
          />
        </div>
        <textarea
          id="pet-desc"
          rows={5}
          value={form.description}
          onChange={set('description')}
          placeholder="Describe your issue in detail — context, location landmarks, severity, and impacted population..."
          className={cn('form-input resize-none', errors.description && 'border-[#E13B22]')}
        />
        <div className="flex justify-between mt-1 text-[11px] font-mono text-[#6F6F6A]">
          {errors.description ? <span className="text-[#E13B22]">{errors.description}</span> : <span />}
          <span>{form.description.length} chars</span>
        </div>
      </div>

      {/* Department Choice */}
      <div>
        <label htmlFor="pet-dept" className="form-label mb-1.5">
          Department Jurisdiction (Optional)
        </label>
        <select
          id="pet-dept"
          value={form.citizen_department_id}
          onChange={set('citizen_department_id')}
          className="form-input text-xs"
        >
          <option value="">Let Autonomous Triage decide</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <p className="text-[11px] text-[#6F6F6A] mt-1 font-mono">
          AI will verify and cross-reference jurisdiction with official department responsibilities.
        </p>
      </div>

      {/* Location Text */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="pet-loc" className="form-label mb-0">
            <MapPin size={13} className="inline mr-1" /> Street Address / Landmark *
          </label>
          <MicButton 
            onTranscript={(text) => setForm(p => ({ ...p, location: p.location + (p.location && !p.location.endsWith(' ') ? ' ' : '') + text }))} 
            language={i18n.language} 
          />
        </div>
        <input
          id="pet-loc"
          type="text"
          value={form.location}
          onChange={set('location')}
          placeholder="e.g. Gandhi Road, Near Post Office, Chennai"
          className={cn('form-input', errors.location && 'border-[#E13B22]')}
        />
        {errors.location && <p className="text-[11px] font-mono text-[#E13B22] mt-1">{errors.location}</p>}
      </div>

      {/* Map Pin Location */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="form-label mb-0">
            <Navigation size={13} className="inline mr-1" /> Spatial Coordinates (200m Cluster Radar) *
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase px-2.5 py-1 rounded bg-[#F7F6F2] text-[#181817] hover:border-[#181817] border border-[#DDDCD7] transition-colors disabled:opacity-60"
          >
            {gpsLoading ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />}
            {gpsLoading ? "Detecting GPS..." : "GPS Pin"}
          </button>
        </div>

        {gpsError && (
          <div className="text-xs text-[#E13B22] bg-[#FFF0EB] border border-[#F05A3C]/30 rounded p-2.5 mb-2 font-mono">
            {gpsError}
          </div>
        )}

        <div className={cn('h-64 w-full rounded-md overflow-hidden border', errors.position ? 'border-[#E13B22]' : 'border-[#DDDCD7]')}>
          <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker 
              position={position} 
              setPosition={setPosition} 
              setLocationSource={setLocationSource} 
              setLocationAccuracy={setLocationAccuracy} 
            />
            <MapController flyTo={flyTo} />
          </MapContainer>
        </div>

        <p className="text-[11px] font-mono text-[#6F6F6A] mt-1">
          {position
            ? `📍 Pinned: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
            : 'Click the map or click "GPS Pin" to calibrate coordinates.'}
        </p>
        {errors.position && <p className="text-[11px] font-mono text-[#E13B22] mt-1">{errors.position}</p>}
      </div>

      {/* Image Upload */}
      <div>
        <label className="form-label mb-2 block">
          <ImageIcon size={13} className="inline mr-1" /> Evidence Photos * (Max {MAX_FILES})
        </label>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {previews.map((src, i) => (
              <div key={src} className="relative group aspect-square rounded overflow-hidden border border-[#DDDCD7] bg-[#F7F6F2]">
                <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_FILES && (
          <label
            className="flex flex-col items-center justify-center gap-1.5 h-20 rounded border-2 border-dashed border-[#DDDCD7] hover:border-[#181817] hover:bg-[#F7F6F2] cursor-pointer transition-colors text-[#6F6F6A]"
          >
            <ImageIcon size={18} />
            <span className="text-xs font-mono">
              Upload photo evidence ({images.length}/{MAX_FILES}) — JPG, PNG, WebP up to 5 MB
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>
        )}

        {errors.images && (
          <p className="text-[11px] font-mono text-[#E13B22] mt-1">
            {errors.images}
          </p>
        )}
      </div>

      {errors.submit && (
        <div className="rounded p-3 text-xs font-mono text-[#E13B22] bg-[#FFF0EB] border border-[#F05A3C]/30">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#DDDCD7]">
        <p className="text-[11px] font-mono text-[#6F6F6A]">* Required fields</p>
        <button type="submit" disabled={isPending} className="btn-cta text-xs px-6 py-3">
          {isPending ? <><Loader2 size={13} className="animate-spin" /> Lodging Application...</> : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
