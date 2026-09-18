import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOfficers, createOfficer, getDepartments, deleteOfficer } from '@/api/admin.api';
import { Plus, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';

export default function OfficerManagement() {
  usePageTitle('Officers Directory');
  const queryClient = useQueryClient();
  const { data: officers = [], isLoading: offLoading } = useQuery({ queryKey: ['admin', 'officers'], queryFn: () => getOfficers() });
  const { data: depts = [], isLoading: deptLoading } = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => getDepartments() });
  const { mutateAsync: add, isPending } = useMutation({
    mutationFn: createOfficer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'officers'] }),
  });
  const { mutateAsync: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteOfficer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'officers'] }),
  });

  const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department_id) {
      setError('All fields are required.');
      return;
    }
    try {
      setError('');
      await add(form);
      setForm({ name: '', email: '', password: '', department_id: '' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create officer.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteError('');
      await remove(deleteId.id);
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.detail || 'Failed to delete officer.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#DDDCD7] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
            ADMINISTRATION DIRECTORY
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
            OFFICERS
          </h1>
          <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
            {officers.length} personnel enrolled across state departments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Enroll Officer Form (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-md border border-[#DDDCD7] shadow-card">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817] flex items-center gap-2 mb-4 border-b border-[#DDDCD7] pb-2">
            <Plus size={14} className="text-[#F05A3C]" /> Enroll Officer
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" placeholder="e.g. A. Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Official Email *</label>
              <input type="email" className="form-input" placeholder="officer@tn.gov.in" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Temporary Password *</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Department Jurisdiction *</label>
              <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} required>
                <option value="">Select Ministry...</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.department_code ? `${d.department_code} — ` : ''}{d.name}</option>)}
              </select>
            </div>
            {error && (
              <div className="text-xs text-[#E13B22] bg-[#FFF0EB] border border-[#F05A3C]/30 p-2.5 rounded font-mono">
                {error}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full py-2.5 text-xs font-bold uppercase">
              {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create Officer Account'}
            </button>
          </form>
        </div>

        {/* Minimalist Officer Directory (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-md border border-[#DDDCD7] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F6F2] border-b border-[#DDDCD7]">
              <tr>
                <th className="px-5 py-3 font-mono font-bold text-[#6F6F6A] uppercase tracking-wider">NAME</th>
                <th className="px-5 py-3 font-bold text-[#6F6F6A] uppercase tracking-wider">DEPARTMENT</th>
                <th className="px-5 py-3 font-bold text-[#6F6F6A] uppercase tracking-wider">STATUS</th>
                <th className="px-5 py-3 font-bold text-[#6F6F6A] uppercase tracking-wider text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDCD7]">
              {(offLoading || deptLoading) ? (
                <tr><td colSpan={4} className="text-center py-10 text-[#6F6F6A] font-mono"><Loader2 size={16} className="animate-spin inline mr-2 text-[#181817]" />LOADING PERSONNEL...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-[#6F6F6A] font-mono">NO OFFICERS ENROLLED.</td></tr>
              ) : (
                officers.map((o) => {
                  const dept = depts.find(d => d.id === o.department_id);
                  const initials = o.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'OF';
                  return (
                    <tr key={o.id} className="hover:bg-[#FFF0EB]/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#181817] text-white flex items-center justify-center font-mono font-bold text-[10px]">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#181817]">{o.name}</div>
                            <div className="text-[10px] font-mono text-[#6F6F6A] mt-0.5">{o.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#181817] font-medium">
                        {dept ? dept.name : <span className="text-[#6F6F6A]">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#181817]">
                          <span className="text-base text-[#F05A3C] leading-none">●</span>
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button 
                          onClick={() => setDeleteId(o)} 
                          className="text-[#6F6F6A] hover:text-[#E13B22] p-1 rounded transition-colors"
                          title="Revoke Officer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Modal */}
      {deleteId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#181817]/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DDDCD7] rounded-md shadow-elevated w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#E13B22]">
                <AlertTriangle size={16} />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817]">Revoke Access</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-[#6F6F6A] hover:text-[#181817]">
                <X size={15} />
              </button>
            </div>
            
            <p className="text-xs text-[#6F6F6A]">
              Revoke portal access for <strong className="text-[#181817]">{deleteId.name}</strong>?
            </p>
            {deleteError && (
              <div className="text-xs text-[#E13B22] bg-[#FFF0EB] p-2 rounded border border-[#F05A3C]/30 font-mono">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="btn-primary bg-[#E13B22] hover:bg-[#b91c1c] flex-1 text-xs"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : 'Revoke'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
