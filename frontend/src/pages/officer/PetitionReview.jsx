import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useUpdatePetition } from '@/hooks/usePetitions';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Loader2, MapPin, Calendar, Clock, Edit3, CheckCircle, XCircle, User, Mail, ExternalLink, ShieldCheck, ShieldAlert, Shield, FileText, Upload } from 'lucide-react';
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
    return <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-[#315C4A]" /></div>;
  }

  if (!petition) {
    return <div className="bg-white rounded-2xl border border-[#E5E5DE] p-16 text-center text-[#68716B]">Petition record not found.</div>;
  }

  const analysis = petition.ai_analysis;
  const hasLocation = petition.latitude != null && petition.longitude != null;

  const handleAction = async (actionStatus) => {
    if (actionStatus === 'resolved') {
      if (!form.notes.trim()) {
        alert('Resolution determination note is required.');
        return;
      }
      if (!resolutionFiles.length) {
        alert('Resolution proof attachment is required.');
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
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Case File Header */}
      <div>
        <Link
          to="/officer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C4A] hover:underline mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Department Ledger
        </Link>

        <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 sm:p-8 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E5DE]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#78917F] block mb-1">
                GOVERNMENT CASE FILE
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#202522] tracking-tight">
                {petition.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-[#68716B] bg-[#F8F7F2] px-3 py-1 rounded-md border border-[#E5E5DE]">
                {petition.petition_number}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-[#EFF4F0] text-[#315C4A] border-[#D4E2D8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#315C4A]" />
                {petition.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#68716B] mb-1">Applicant</p>
              <p className="text-sm font-semibold text-[#202522]">{petition.submitter_name || 'Citizen'}</p>
              <p className="text-xs text-[#68716B] truncate mt-0.5">{petition.submitter_email || '—'}</p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#68716B] mb-1">Jurisdiction</p>
              <p className="text-sm font-semibold text-[#202522]">
                {petition.department_name || petition.ai_analysis?.department || 'Unassigned'}
              </p>
              <p className="text-xs text-[#68716B] mt-0.5">{petition.category || petition.ai_analysis?.category || 'General'}</p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#68716B] mb-1">Submission Date</p>
              <p className="text-sm font-semibold text-[#202522] font-mono">{formatDateShort(petition.created_at)}</p>
              <p className="text-xs text-[#68716B] mt-0.5">Recorded in Ledger</p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#68716B] mb-1">Location Status</p>
              <p className="text-sm font-semibold text-[#202522] flex items-center gap-1">
                <MapPin size={13} className="text-[#315C4A]" />
                <span className="truncate">{petition.location || 'Coordinates logged'}</span>
              </p>
              {petition.location_verification_status === 'VERIFIED' && (
                <span className="text-[10px] text-[#315C4A] font-medium block mt-0.5">✓ GPS Verified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side (7 cols): Grievance Details, Map & Action Console */}
        <div className="lg:col-span-7 space-y-6">
          {/* Grievance Statement */}
          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 sm:p-8 shadow-card">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-2">
              APPLICANT STATEMENT
            </span>
            <p className="text-[#202522] leading-relaxed text-sm whitespace-pre-wrap">
              {petition.description}
            </p>
          </div>

          {/* Location Coordinates Map */}
          <div className="bg-white rounded-2xl border border-[#E5E5DE] overflow-hidden shadow-card">
            <div className="px-6 py-4 flex justify-between items-center border-b border-[#E5E5DE] bg-[#F8F7F2]">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#68716B]">
                Geospatial Coordinate Record
              </span>
              {hasLocation && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${petition.latitude},${petition.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-[#315C4A] hover:underline flex items-center gap-1 font-medium"
                >
                  Satellite Map <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="h-[280px] w-full bg-[#F8F7F2]">
              {hasLocation ? (
                <MapContainer center={[petition.latitude, petition.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[petition.latitude, petition.longitude]} />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#68716B] text-xs">
                  No GPS coordinates recorded for this application.
                </div>
              )}
            </div>
          </div>

          {/* Officer Action Console */}
          {petition.status !== 'resolved' && petition.status !== 'rejected' ? (
            <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#E5E5DE]">
                <Edit3 size={16} className="text-[#315C4A]" />
                <h2 className="text-sm font-bold text-[#202522] uppercase tracking-wider">
                  Officer Action & Determination
                </h2>
              </div>

              {overrideMode ? (
                <div className="space-y-4 bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E5DE] mb-4">
                  <div>
                    <label className="form-label">Transfer to Ministry</label>
                    <select className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                      <option value="">Retain AI Recommendation ({analysis?.department})</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority Re-evaluation</label>
                    <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      <option value="">Retain AI Priority ({analysis?.priority})</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button onClick={() => setOverrideMode(false)} className="text-xs text-[#68716B] hover:text-[#202522]">Cancel Override</button>
                    <button 
                      onClick={() => handleAction('under_review')} 
                      disabled={updateLoading || (!form.department && !form.priority)} 
                      className="btn-primary text-xs"
                    >
                      Apply Override
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <button onClick={() => setOverrideMode(true)} className="text-xs text-[#315C4A] hover:underline font-medium">
                    + Override Department / Priority Recommendation
                  </button>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <label className="form-label">Official Determination Notes</label>
                <textarea
                  className="form-input resize-none text-xs" rows={3}
                  placeholder="Record formal field inspection results, sanction details, or reasoning..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              
              <div className="space-y-2 mb-6">
                <label className="form-label flex items-center gap-1.5">
                  <Upload size={12} className="text-[#315C4A]" />
                  Resolution Proof Photo (Required to resolve)
                </label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="form-input text-xs"
                  onChange={(e) => setResolutionFiles(Array.from(e.target.files))}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleAction('resolved')}
                  disabled={updateLoading}
                  className="btn-primary"
                >
                  <CheckCircle size={14} /> Resolve Grievance
                </button>
                <button
                  onClick={() => handleAction('rejected')}
                  disabled={updateLoading}
                  className="btn-danger"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={() => handleAction('duplicate')}
                  disabled={updateLoading}
                  className="btn-secondary"
                >
                  Link as Duplicate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#EFF4F0] rounded-2xl p-6 border border-[#D4E2D8]">
              <h2 className="text-sm font-bold text-[#315C4A] flex items-center gap-2">
                <CheckCircle size={16} />
                Petition Formally Concluded
              </h2>
              <p className="text-xs text-[#68716B] mt-1.5 leading-relaxed">
                This petition record is finalized. The action log below preserves the complete historical determination.
              </p>
            </div>
          )}
        </div>

        {/* Right Side (5 cols): AI Intelligence & Audit Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <AIAnalysisPanel analysis={analysis} role="officer" petition={petition} />

          {/* Review Timeline */}
          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 shadow-card">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-4">
              REVIEW AUDIT TRAIL
            </span>
            <StatusTimeline history={petition.history ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
