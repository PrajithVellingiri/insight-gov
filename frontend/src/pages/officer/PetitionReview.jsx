import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useUpdatePetition } from '@/hooks/usePetitions';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Loader2, MapPin, Calendar, Clock, Edit3, CheckCircle, XCircle, User, Mail, ExternalLink, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

const DEPARTMENTS = [
  "Finance Department", "Home, Prohibition and Excise Department", "Revenue and Disaster Management Department",
  "Commercial Taxes and Registration Department", "Human Resources Management Department", "Law Department",
  "Legislative Assembly Department", "Public Department", "Public (Elections) Department", "Health and Family Welfare Department",
  "School Education Department", "Higher Education Department", "Social Welfare and Women Empowerment Department",
  "Co-operation, Food and Consumer Protection Department", "Welfare of Differently Abled Persons Department",
  "BC, MBC & Minorities Welfare Department", "Adi Dravidar and Tribal Welfare Department", "Social Justice Department",
  "Social Reforms Department", "Highways and Minor Ports Department", "Public Works Department (PWD)",
  "Water Resources Department", "Municipal Administration and Water Supply Department", "Housing and Urban Development Department",
  "Energy Department", "Transport Department", "Environment, Climate Change and Forests Department",
  "Natural Resources Department", "Industries, Investment Promotion & Commerce Department",
  "Micro, Small and Medium Enterprises Department (MSME)", "Rural Development and Panchayat Raj Department",
  "Information Technology and Digital Services Department", "Planning, Development and Special Initiatives Department",
  "Special Programme Implementation Department", "Mudalvarin Mugavari Department", "Agriculture - Farmers Welfare Department",
  "Animal Husbandry, Dairying, Fisheries and Fishermen Welfare Department", "Labour Welfare and Skill Development Department",
  "Handlooms, Handicrafts, Textiles and Khadi Department", "Tamil Development and Information Department",
  "Tourism, Culture and Religious Endowments Department", "Youth Welfare and Sports Development Department"
];

export default function PetitionReview() {
  const { id } = useParams();
  const { data: petition, isLoading } = usePetition(id);
  const { mutateAsync: update, isPending: updateLoading } = useUpdatePetition();

  const [overrideMode, setOverrideMode] = useState(false);
  const [form, setForm] = useState({ department: '', priority: '', notes: '' });
  const [resolutionFiles, setResolutionFiles] = useState([]);

  useEffect(() => {
    setOverrideMode(false);
    setForm({ department: '', priority: '', notes: '' });
    setResolutionFiles([]);
  }, [id, petition]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>;
  }

  if (!petition) {
    return <div className="card text-center py-14">Petition not found.</div>;
  }

  const analysis = petition.ai_analysis;
  const hasLocation = petition.latitude != null && petition.longitude != null;

  const handleAction = async (actionStatus) => {
    // Phase 2/Bugfix Validation
    if (actionStatus === 'resolved') {
      if (!form.notes.trim()) {
        alert('Resolution description is required.');
        return;
      }
      if (!resolutionFiles.length) {
        alert('Resolution proof image is required.');
        return;
      }
    }

    try {
      if (actionStatus === 'resolved' && resolutionFiles.length > 0) {
        const { uploadPetitionImages } = await import('@/api/petitions.api');
        await uploadPetitionImages(id, resolutionFiles, 'resolution');
      }

      let finalStatus = actionStatus;
      let finalNote = form.notes;
      if (actionStatus === 'duplicate') {
        finalStatus = 'rejected';
        finalNote = finalNote ? `Duplicate: ${finalNote}` : 'Marked as duplicate.';
      }
      const payload = { status: finalStatus, note: finalNote || null };
      if (overrideMode) {
        if (form.department) payload.department_override = form.department;
        if (form.priority) payload.priority_override = form.priority;
      }
      await update({ id, data: payload });
      setOverrideMode(false);
      setForm({ department: '', priority: '', notes: '' });
      setResolutionFiles([]);
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
          <Link to="/officer/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 no-underline">
            <ArrowLeft size={14} /> Back to Queue
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{petition.title}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 group relative">
              <MapPin size={13} /> {petition.location}
              
              {petition.location_verification_status === 'VERIFIED' && <ShieldCheck size={13} className="text-emerald-500 ml-1" title="Location Verified" />}
              {petition.location_verification_status === 'MISMATCH' && <ShieldAlert size={13} className="text-amber-500 ml-1" title="Location Requires Review" />}
              {(petition.location_verification_status === 'UNAVAILABLE' || petition.location_verification_status === 'unverified') && <Shield size={13} className="text-slate-400 ml-1" title="Location Unavailable" />}

              {petition.location_verification_reason && (
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-slate-100 text-xs rounded shadow-lg z-50 pointer-events-none">
                  {petition.location_verification_reason}
                </div>
              )}
            </div>
            <span className="flex items-center gap-1"><Calendar size={13} /> {formatDateShort(petition.created_at)}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> ID: <code className="font-mono text-xs">{petition.id}</code></span>
          </div>
        </div>

        {/* Submitter Details */}
        <div className="card bg-primary/5 border border-primary/10 flex flex-wrap gap-x-8 gap-y-2 py-3 px-4 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User size={16} /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Submitted By</p>
              <p className="text-sm font-semibold text-foreground">{petition.submitter_name || 'Anonymous'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><Mail size={16} /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Email Address</p>
              <p className="text-sm font-semibold text-foreground">{petition.submitter_email || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Petition Details</h2>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{petition.description}</p>
        </div>

        {/* Coordinates Map */}
        <div className="card p-1 pb-2">
          <div className="px-4 pt-3 pb-2 flex justify-between items-center">
            <h2 className="section-title mb-0">Exact Location</h2>
            {hasLocation && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${petition.latitude},${petition.longitude}`}
                target="_blank" rel="noreferrer"
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
              >
                Open in Maps <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="h-[300px] w-full rounded-b-xl overflow-hidden bg-slate-100">
            {hasLocation ? (
              <MapContainer center={[petition.latitude, petition.longitude]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[petition.latitude, petition.longitude]} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-2">
                <MapPin size={32} className="opacity-20" />
                <p>No exact coordinates provided by citizen.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: AI & Actions */}
      <div className="space-y-6">
        <AIAnalysisPanel analysis={analysis} role="officer" petition={petition} />

        {/* Officer Action Panel */}
        {petition.status !== 'resolved' && petition.status !== 'rejected' ? (
          <div className="card border-primary/20 shadow-md">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Edit3 size={16} className="text-primary" /> Officer Decision
            </h2>

            {overrideMode ? (
              <div className="space-y-4 animate-fade-in bg-secondary p-4 rounded-lg border border-border mb-4">
                <div>
                  <label className="form-label">Override Department</label>
                  <select className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Keep AI Suggestion ({analysis?.department})</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
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
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => setOverrideMode(false)} className="text-xs text-muted-foreground hover:text-foreground underline">Cancel Override</button>
                  <button 
                    onClick={() => handleAction('under_review')} 
                    disabled={updateLoading || (!form.department && !form.priority)} 
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Apply Override & Transfer
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <button onClick={() => setOverrideMode(true)} className="text-sm text-primary hover:text-primary/80 underline font-medium">
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
            
            <div className="space-y-3 mb-4">
              <label className="form-label">Resolution Proof (Required for Resolve)</label>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="form-input text-sm"
                onChange={(e) => setResolutionFiles(Array.from(e.target.files))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAction('resolved')} disabled={updateLoading} className="btn-accent shadow-sm">
                <CheckCircle size={14} /> Resolve
              </button>
              <button onClick={() => handleAction('rejected')} disabled={updateLoading} className="btn-danger shadow-sm">
                <XCircle size={14} /> Reject
              </button>
              <button onClick={() => handleAction('duplicate')} disabled={updateLoading} className="btn-secondary col-span-2">
                Mark as Duplicate
              </button>
            </div>
          </div>
        ) : (
          <div className={cn("card border shadow-md", petition.status === 'resolved' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200')}>
            <h2 className={cn("text-sm font-semibold flex items-center gap-2", petition.status === 'resolved' ? 'text-green-800' : 'text-red-800')}>
              {petition.status === 'resolved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {petition.status === 'resolved' ? 'Petition Resolved' : 'Petition Closed / Rejected'}
            </h2>
            <p className={cn("text-sm mt-1", petition.status === 'resolved' ? 'text-green-600' : 'text-red-600')}>
              This petition has been closed. You can review its history below.
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="card">
          <h2 className="section-title mb-4">Status History</h2>
          <StatusTimeline history={petition.history ?? []} />
        </div>
      </div>
    </div>
  );
}
