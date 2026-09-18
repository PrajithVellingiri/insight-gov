import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePetition, useUpdatePetition } from '@/hooks/usePetitions';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import StatusTimeline from '@/components/petition/StatusTimeline';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Loader2, MapPin, Edit3, CheckCircle, XCircle, ExternalLink, Upload } from 'lucide-react';
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
    return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-[#181817]" /></div>;
  }

  if (!petition) {
    return <div className="bg-white rounded-md border border-[#DDDCD7] p-16 text-center text-[#6F6F6A] font-mono text-xs">APPLICATION RECORD NOT FOUND.</div>;
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
    <div className="space-y-8 pb-16">
      {/* Navigation */}
      <Link
        to="/officer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#181817] hover:text-[#F05A3C] transition-colors"
      >
        <ArrowLeft size={13} /> Back to Department Ledger
      </Link>

      {/* Digital Case File Header */}
      <div className="border-b border-[#DDDCD7] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold text-[#F05A3C] uppercase tracking-wider">
                APPLICATION #{petition.petition_number}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#181817] text-white">
                {petition.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#181817] uppercase tracking-tight">
              {petition.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#6F6F6A] bg-white px-3 py-1 rounded border border-[#DDDCD7]">
              {formatDateShort(petition.created_at)}
            </span>
          </div>
        </div>

        {/* Case Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 mt-6 border-t border-[#DDDCD7] text-xs">
          <div>
            <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Applicant</p>
            <p className="font-bold text-[#181817] mt-0.5">{petition.submitter_name || 'Citizen'}</p>
            <p className="font-mono text-[#6F6F6A] text-[11px] truncate">{petition.submitter_email || '—'}</p>
          </div>

          <div>
            <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Jurisdiction</p>
            <p className="font-bold text-[#181817] mt-0.5">
              {petition.department_name || petition.ai_analysis?.department || 'Unassigned'}
            </p>
            <p className="text-[11px] text-[#6F6F6A]">{petition.category || petition.ai_analysis?.category || 'General'}</p>
          </div>

          <div>
            <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Filing Record</p>
            <p className="font-bold text-[#181817] font-mono mt-0.5">{formatDateShort(petition.created_at)}</p>
            <p className="text-[11px] text-[#6F6F6A]">Recorded in Ledger</p>
          </div>

          <div>
            <p className="font-mono uppercase text-[#6F6F6A] text-[10px]">Geospatial Status</p>
            <p className="font-bold text-[#181817] truncate mt-0.5 flex items-center gap-1">
              <MapPin size={12} className="text-[#F05A3C]" />
              {petition.location || 'Coordinates logged'}
            </p>
            {petition.location_verification_status === 'VERIFIED' && (
              <span className="text-[10px] font-mono text-[#181817] block mt-0.5">✓ GPS Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Applicant Statement, Satellite Map, Action Console */}
        <div className="lg:col-span-7 space-y-6">
          {/* Statement */}
          <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6F6F6A] block mb-3 border-b border-[#DDDCD7] pb-2">
              APPLICANT STATEMENT
            </span>
            <p className="text-[#181817] leading-relaxed text-xs whitespace-pre-wrap font-sans">
              {petition.description}
            </p>
          </div>

          {/* Map */}
          <div className="bg-white rounded-md border border-[#DDDCD7] overflow-hidden">
            <div className="px-5 py-3 flex justify-between items-center border-b border-[#DDDCD7] bg-[#F7F6F2]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817]">
                Geospatial Coordinate Record
              </span>
              {hasLocation && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${petition.latitude},${petition.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-[#181817] hover:text-[#F05A3C] flex items-center gap-1 font-mono font-semibold uppercase"
                >
                  External Map <ExternalLink size={10} />
                </a>
              )}
            </div>
            <div className="h-[260px] w-full bg-[#F7F6F2]">
              {hasLocation ? (
                <MapContainer center={[petition.latitude, petition.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[petition.latitude, petition.longitude]} />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#6F6F6A] text-xs font-mono">
                  NO GPS COORDINATES RECORDED.
                </div>
              )}
            </div>
          </div>

          {/* Action Console */}
          {petition.status !== 'resolved' && petition.status !== 'rejected' ? (
            <div className="bg-white rounded-md border border-[#DDDCD7] p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DDDCD7]">
                <Edit3 size={15} className="text-[#F05A3C]" />
                <h2 className="text-xs font-mono font-bold text-[#181817] uppercase tracking-wider">
                  Officer Action & Determination Console
                </h2>
              </div>

              {overrideMode ? (
                <div className="space-y-4 bg-[#F7F6F2] p-4 rounded border border-[#DDDCD7]">
                  <div>
                    <label className="form-label">Transfer to Department Jurisdiction</label>
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
                    <button onClick={() => setOverrideMode(false)} className="text-xs font-mono text-[#6F6F6A] hover:text-[#181817]">Cancel Override</button>
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
                <div>
                  <button onClick={() => setOverrideMode(true)} className="text-xs font-mono font-bold uppercase text-[#181817] hover:text-[#F05A3C] transition-colors">
                    + Override Department / Priority Recommendation
                  </button>
                </div>
              )}

              <div>
                <label className="form-label">Official Determination Notes</label>
                <textarea
                  className="form-input resize-none text-xs" rows={3}
                  placeholder="Record formal field inspection results, sanction details, or reasoning..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Upload size={12} className="text-[#F05A3C]" />
                  Resolution Proof Document / Photo (Required to resolve)
                </label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="form-input text-xs"
                  onChange={(e) => setResolutionFiles(Array.from(e.target.files))}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleAction('resolved')}
                  disabled={updateLoading}
                  className="btn-cta text-xs"
                >
                  <CheckCircle size={13} /> Resolve Grievance
                </button>
                <button
                  onClick={() => handleAction('rejected')}
                  disabled={updateLoading}
                  className="btn-primary bg-[#E13B22] hover:bg-[#b91c1c] text-xs"
                >
                  <XCircle size={13} /> Reject
                </button>
                <button
                  onClick={() => handleAction('duplicate')}
                  disabled={updateLoading}
                  className="btn-secondary text-xs"
                >
                  Link as Duplicate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#181817] text-[#F7F6F2] rounded-md p-6 border border-[#292927]">
              <h2 className="text-xs font-mono font-bold text-[#F05A3C] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={15} />
                Petition Formally Concluded
              </h2>
              <p className="text-xs text-[#A3A39E] mt-1.5 leading-relaxed font-sans">
                This petition docket is finalized. The audit trail below preserves the complete historical determination.
              </p>
            </div>
          )}
        </div>

        {/* Right 5 Columns: AI Intelligence & Review Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <AIAnalysisPanel analysis={analysis} role="officer" petition={petition} />

          {/* Audit Timeline */}
          <div className="bg-white rounded-md border border-[#DDDCD7] p-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6F6F6A] block mb-4 border-b border-[#DDDCD7] pb-2">
              AUDIT TRAIL MILESTONES
            </span>
            <StatusTimeline history={petition.history ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
