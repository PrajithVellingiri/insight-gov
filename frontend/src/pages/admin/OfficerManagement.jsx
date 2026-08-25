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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Officers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage government officers and assign departments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card h-fit">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Plus size={18} className="text-primary-600" /> Add Officer
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Temporary Password</label>
              <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                <option value="">Select Dept...</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.department_code} - {d.name}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Officer'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 card p-0 overflow-hidden h-fit">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Name/Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Department</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(offLoading || deptLoading) ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No officers found.</td></tr>
              ) : (
                officers.map((o) => (
                  <tr key={o.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground flex items-center gap-2"><Users size={14} className="text-muted-foreground" /> {o.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{
                      (depts.find(d => d.id === o.department_id) 
                        ? `${depts.find(d => d.id === o.department_id).department_code} - ${depts.find(d => d.id === o.department_id).name}` 
                        : 'Unassigned')
                    }</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateShort(o.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(o)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h2 className="text-lg font-bold text-foreground">Delete Officer</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-muted-foreground hover:text-muted-foreground rounded-full p-1">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete officer <strong>{deleteId.name}</strong>?
            </p>
            {deleteError && (
              <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="btn-secondary flex-1">Cancel</button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-60"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
