import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOfficers, createOfficer, getDepartments, deleteOfficer } from '@/api/admin.api';
import { Users, Plus, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';

export default function OfficerManagement() {
  usePageTitle('Officers');
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
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="page-header">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
            01 / ADMINISTRATION
          </span>
          <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight flex items-center gap-2.5">
            <Users size={26} className="text-[#315C4A]" />
            Department Review Officers
          </h1>
          <p className="text-sm text-[#68716B] mt-1 max-w-xl leading-relaxed">
            Manage authorized state officers, review account credentials, and assign ministerial jurisdictions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white h-fit p-6 rounded-2xl border border-[#E5E5DE] shadow-card">
          <h2 className="text-sm font-bold text-[#202522] flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Plus size={16} className="text-[#315C4A]" /> Enroll Officer
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Officer Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Official Email</label>
              <input type="email" className="form-input" placeholder="officer@tn.gov.in" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Temporary Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Department Jurisdiction</label>
              <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                <option value="">Select Ministry...</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.department_code ? `${d.department_code} — ` : ''}{d.name}</option>)}
              </select>
            </div>
            {error && (
              <div className="text-xs text-[#B91C1C] bg-[#FDF2F2] border border-[#FBD5D5] p-2.5 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Officer Account'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-[#E5E5DE] shadow-card overflow-hidden h-fit">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8F7F2] border-b border-[#E5E5DE]">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider">Officer</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider">Ministry</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider">Enrolled</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5DE]">
              {(offLoading || deptLoading) ? (
                <tr><td colSpan={4} className="text-center py-10 text-[#68716B]"><Loader2 size={18} className="animate-spin inline mr-2 text-[#315C4A]" />Loading personnel...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-[#68716B]">No officers enrolled.</td></tr>
              ) : (
                officers.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F8F7F2]/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#202522]">{o.name}</div>
                      <div className="text-xs text-[#68716B] mt-0.5">{o.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[#202522] text-xs">
                      {(() => {
                        const dept = depts.find(d => d.id === o.department_id);
                        if (!dept) return <span className="text-[#68716B]">Unassigned</span>;
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EFF4F0] text-[#315C4A] border border-[#D4E2D8]">
                            {dept.name}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-[#68716B] text-xs font-mono">{formatDateShort(o.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => setDeleteId(o)} 
                        className="text-[#68716B] hover:text-[#B91C1C] p-1 rounded transition-colors"
                        title="Remove Officer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#202522]/30 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5E5DE] rounded-2xl shadow-dropdown w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#C58B5B]">
                <AlertTriangle size={18} />
                <h2 className="text-base font-bold text-[#202522]">Revoke Officer</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-[#68716B] hover:text-[#202522] rounded-lg p-1">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-[#68716B]">
              Are you sure you want to remove <strong className="text-[#202522]">{deleteId.name}</strong>? Their portal access will be revoked.
            </p>
            {deleteError && (
              <div className="text-xs text-[#B91C1C] bg-[#FDF2F2] p-2.5 rounded-xl border border-[#FBD5D5]">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="btn-danger flex-1 text-xs"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Revoke'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
