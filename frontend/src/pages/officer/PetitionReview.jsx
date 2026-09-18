import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useUpdatePetition } from '@/hooks/usePetitions';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Loader2, MapPin, Calendar, Clock, Edit3, CheckCircle, XCircle, User, Mail, ExternalLink, ShieldCheck, ShieldAlert, Shield, Sparkles, FileText, Upload } from 'lucide-react';
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
    return <div className="flex justify-center py-24"><Loader2 size={36} className="animate-spin text-blue-400" /></div>;
  }

  if (!petition) {
    return <div className="card text-center py-16 text-muted-foreground">Petition not found in database.</div>;
  }

  const analysis = petition.ai_analysis;
  const hasLocation = petition.latitude != null && petition.longitude != null;

  const handleAction = async (actionStatus) => {
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start pb-12">
      {/* Left Column: Details & Geospatial Radar */}
      <div className="xl:col-span-2 space-y-6">
        <div>
          <Link
            to="/officer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Department Queue
          </Link>
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
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5 group relative">
              <MapPin size={13} className="text-blue-400" />
              <span>{petition.location}</span>
              {petition.location_verification_status === 'VERIFIED' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
                  <ShieldCheck size={11} /> GPS Verified
                </span>
              )}
              {petition.location_verification_status === 'MISMATCH' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-semibold">
                  <ShieldAlert size={11} /> Review Needed
                </span>
              )}
              {petition.location_verification_reason && (
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-64 p-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl shadow-2xl z-50 pointer-events-none">
                  {petition.location_verification_reason}
                </div>
              )}
            </div>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar size={12} className="text-muted-foreground" />
              {formatDateShort(petition.created_at)}
            </span>
          </div>
        </div>

        {/* Submitter Telemetry Card */}
        <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <User size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Citizen Submitter</p>
              <p className="text-sm font-bold text-foreground">{petition.submitter_name || 'Anonymous Citizen'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-muted-foreground">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Contact Email</p>
              <p className="text-xs font-mono text-slate-300">{petition.submitter_email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Petition Description */}
        <div className="card space-y-2">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/60">
            <FileText size={16} className="text-blue-400" />
            <h2 className="section-title !mb-0">Grievance Statement</h2>
          </div>
          <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap font-normal">
            {petition.description}
          </p>
        </div>

        {/* Coordinates Map */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
          <div className="px-5 py-3.5 flex justify-between items-center border-b border-slate-800/80 bg-slate-950/70">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Geospatial Radar Coordinates</h2>
            </div>
            {hasLocation && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${petition.latitude},${petition.longitude}`}
                target="_blank" rel="noreferrer"
                className="text-xs inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                External Satellite Map <ExternalLink size={11} />
              </a>
            )}
          </div>
          <div className="h-[320px] w-full bg-slate-950">
            {hasLocation ? (
              <MapContainer center={[petition.latitude, petition.longitude]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[petition.latitude, petition.longitude]} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2">
                <MapPin size={32} className="opacity-30" />
                <p className="text-xs">No GPS coordinates recorded for this petition.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: AI Analysis & Action Decision Suite */}
      <div className="space-y-6">
        <AIAnalysisPanel analysis={analysis} role="officer" petition={petition} />

        {/* Officer Decision Console */}
        {petition.status !== 'resolved' && petition.status !== 'rejected' ? (
          <div className="glass-panel-elevated rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800/80">
              <div className="h-7 w-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <Edit3 size={15} />
              </div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Officer Determination
              </h2>
            </div>

            {overrideMode ? (
              <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 mb-4">
                <div>
                  <label className="form-label">Transfer to Department</label>
                  <select className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Retain AI Recommendation ({analysis?.department})</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Override Priority</label>
                  <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="">Retain AI Priority ({analysis?.priority})</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setOverrideMode(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel Override</button>
                  <button 
                    onClick={() => handleAction('under_review')} 
                    disabled={updateLoading || (!form.department && !form.priority)} 
                    className="btn-primary text-xs py-1.5 px-3.5"
                  >
                    Apply Override & Transfer
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <button onClick={() => setOverrideMode(true)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1">
                  <Sparkles size={12} /> Override AI Recommendations
                </button>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <label className="form-label">Official Determination Notes</label>
              <textarea
                className="form-input resize-none text-xs" rows={3}
                placeholder="e.g. Field inspection completed. Works contract allocated."
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 mb-5">
              <label className="form-label flex items-center gap-1.5">
                <Upload size={12} className="text-blue-400" />
                Resolution Proof Attachment (Required for Resolve)
              </label>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="form-input text-xs"
                onChange={(e) => setResolutionFiles(Array.from(e.target.files))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAction('resolved')}
                disabled={updateLoading}
                className="btn text-white font-semibold text-xs border border-emerald-400/30 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle size={14} /> Resolve Grievance
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={updateLoading}
                className="btn-danger text-xs font-semibold"
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={() => handleAction('duplicate')}
                disabled={updateLoading}
                className="btn-secondary text-xs col-span-2 hover:border-slate-600"
              >
                Flag as Duplicate Entry
              </button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "glass-panel rounded-2xl p-5 border",
            petition.status === 'resolved' ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20'
          )}>
            <h2 className={cn("text-sm font-bold flex items-center gap-2", petition.status === 'resolved' ? 'text-emerald-400' : 'text-rose-400')}>
              {petition.status === 'resolved' ? <CheckCircle size={17} /> : <XCircle size={17} />}
              {petition.status === 'resolved' ? 'Petition Formally Resolved' : 'Petition Concluded / Rejected'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              This petition record is finalized. The action log and timeline below document all historical determinations.
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="card">
          <h2 className="section-title mb-4">Milestone Audit Log</h2>
          <StatusTimeline history={petition.history ?? []} />
        </div>
      </div>
    </div>
  );
}
