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

// ── Leaflet sub-components ──────────────────────────────────────────────────

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

/** Flies the map to a new position whenever `flyTo` changes. */
function MapController({ flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], 16, { animate: true, duration: 1.2 });
    }
  }, [flyTo, map]);
  return null;
}

// ── Allowed image types and limits ─────────────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

// ── Main component ──────────────────────────────────────────────────────────

export default function PetitionForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useSubmitPetition();

  const [form, setForm] = useState({ title: '', description: '', location: '', citizen_department_id: '' });
  const [departments, setDepartments] = useState([]);
  const [position, setPosition] = useState(null);   // { lat, lng }
  const [locationSource, setLocationSource] = useState('manual');
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [flyTo, setFlyTo] = useState(null);          // triggers MapController
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Image upload state
  const [images, setImages] = useState([]);          // File[]
  const [previews, setPreviews] = useState([]);      // object URL strings
  const fileInputRef = useRef(null);

  // Clean up object URLs on unmount / image change
  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  // Load departments
  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── GPS auto-detection ────────────────────────────────────────────────────
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

        // Reverse geocode via Nominatim (no API key required)
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
          // Reverse geocode failure is non-fatal — location pin already set
        }

        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Click the map to pin your location manually.');
        } else {
          setGpsError('Unable to detect location. Click the map to pin your location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // ── Image handling ────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // Validate types
    const badType = selected.find((f) => !ALLOWED_MIME.includes(f.type));
    if (badType) {
      setErrors((prev) => ({ ...prev, images: 'Only JPG, PNG, and WebP images are allowed.' }));
      return;
    }
    // Validate sizes
    const tooBig = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setErrors((prev) => ({ ...prev, images: 'Each image must be under 5 MB.' }));
      return;
    }
    // Validate count
    if (images.length + selected.length > MAX_FILES) {
      setErrors((prev) => ({ ...prev, images: `Maximum ${MAX_FILES} images allowed.` }));
      return;
    }

    const newFiles = [...images, ...selected];
    const newPreviews = [...previews, ...selected.map((f) => URL.createObjectURL(f))];
    setImages(newFiles);
    setPreviews(newPreviews);
    setErrors((prev) => ({ ...prev, images: null }));
    // Reset input so the same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Device Location (Transparent request on submit) ───────────────────────
  const requestDeviceLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
        () => resolve(null), // Timeout, denied, or unavailable gracefully ignored
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
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

  // Default map center: Tamil Nadu
  const defaultCenter = [11.1271, 78.6569];

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="card text-center py-10 animate-fade-in">
        <CheckCircle size={48} className="text-accent-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t("petition_submitted", "Petition Submitted!")}</h2>
        <p className="text-muted-foreground mb-1">{t("petition_received_desc", "Your petition has been received and is being analysed by our AI system.")}</p>
        <p className="text-xs text-muted-foreground mb-6">{t("reference_id", "Reference ID:")} <span className="font-mono font-semibold text-foreground">{submitted.id}</span></p>
        <div className="flex justify-center gap-3">
          <button className="btn-secondary" onClick={() => navigate('/citizen/dashboard')}>{t("go_to_dashboard", "Go to Dashboard")}</button>
          <button className="btn-primary" onClick={() => navigate(`/citizen/petitions/${submitted.id}`)}>{t("track_status", "Track Status")}</button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="pet-title" className="form-label mb-0 block">
            <Type size={13} className="inline mr-1" /> {t("petition_title", "Petition Title")} *
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
          placeholder={t("title_placeholder", "Brief title describing your concern")}
          className={cn('form-input', errors.title && 'border-destructive focus:ring-destructive/20')}
        />
        {errors.title && <p className="form-error"><span>{errors.title}</span></p>}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="pet-desc" className="form-label mb-0 block">
            <FileText size={13} className="inline mr-1" /> {t("description", "Description")} *
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
          placeholder={t("desc_placeholder", "Describe your issue in detail — what happened, who is affected, how long it has been going on...")}
          className={cn('form-input resize-none', errors.description && 'border-destructive')}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? <p className="form-error">{errors.description}</p> : <span />}
          <span className="text-xs text-muted-foreground">{form.description.length} chars</span>
        </div>
      </div>

      {/* Citizen Department Suggestion */}
      <div>
        <label htmlFor="pet-dept" className="form-label block mb-2">
          {t("suggested_department", "Suggested Department (Optional)")}
        </label>
        <select
          id="pet-dept"
          value={form.citizen_department_id}
          onChange={set('citizen_department_id')}
          className="form-input"
        >
          <option value="">{t("let_ai_decide", "Let AI decide")}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          {t("dept_suggestion_desc", "You can suggest a department, but our AI will review and route it appropriately.")}
        </p>
      </div>

      {/* Location Text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="pet-loc" className="form-label mb-0 block">
            <MapPin size={13} className="inline mr-1" /> {t("location_desc", "Location Description")} *
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
          placeholder={t("loc_placeholder", "e.g. MG Road, Gandhi Nagar, Chennai")}
          className={cn('form-input', errors.location && 'border-destructive')}
        />
        {errors.location && <p className="form-error">{errors.location}</p>}
      </div>

      {/* Location Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">
            <Navigation size={13} className="inline mr-1" /> {t("pin_location", "Pin Exact Location on Map")} *
          </label>
          {/* GPS Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors disabled:opacity-60"
          >
            {gpsLoading
              ? <Loader2 size={12} className="animate-spin" />
              : <LocateFixed size={12} />
            }
            {gpsLoading ? t("detecting", "Detecting...") : t("use_current_location", "Use Current Location")}
          </button>
        </div>

        {gpsError && (
          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-2">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        <div className={cn('h-64 w-full rounded-xl overflow-hidden border', errors.position ? 'border-destructive' : 'border-border')}>
          <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

        <p className="text-xs text-muted-foreground mt-1.5">
          {position
            ? `📍 Pinned: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
            : 'Click the map or use "Use Current Location" to pin your location.'}
        </p>
        {errors.position && <p className="form-error mt-1">{errors.position}</p>}
      </div>

      {/* Image Upload */}
      <div>
        <label className="form-label mb-2 block">
          <ImageIcon size={13} className="inline mr-1" /> {t("attach_photos", "Attach Photos")} * (max {MAX_FILES})
        </label>

        {/* Preview grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {previews.map((src, i) => (
              <div key={src} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_FILES && (
          <label
            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors text-muted-foreground hover:text-primary"
          >
            <ImageIcon size={20} />
            <span className="text-xs font-medium">
              Click to add photos ({images.length}/{MAX_FILES}) — JPG, PNG, WebP up to 5 MB each
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
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.images}
          </p>
        )}
      </div>

      {errors.submit && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">* {t("required_fields", "Required fields")}</p>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? <><Loader2 size={14} className="animate-spin" /> {t("submitting", "Submitting...")}</> : t("submit_petition", "Submit Petition")}
        </button>
      </div>
    </form>
  );
}
