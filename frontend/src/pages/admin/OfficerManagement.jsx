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
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users size={22} />
            </div>
            Officers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage departmental administrators, review officers, and workload distribution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 glass-panel h-fit p-6 rounded-2xl border border-slate-800/80">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Plus size={18} className="text-cyan-400" /> Add Officer
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Officer Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="officer@tn.gov.in" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Temporary Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                <option value="">Select Dept...</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.department_code ? `${d.department_code} - ` : ''}{d.name}</option>)}
              </select>
            </div>
            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Officer'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 glass-panel p-0 overflow-hidden h-fit rounded-2xl border border-slate-800/80 shadow-card-3d">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Officer</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(offLoading || deptLoading) ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground"><Loader2 size={20} className="animate-spin inline mr-2 text-cyan-400" />Loading officers...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No officers enrolled.</td></tr>
              ) : (
                officers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <Users size={14} className="text-slate-400" /> {o.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {(() => {
                        const dept = depts.find(d => d.id === o.department_id);
                        if (!dept) return <span className="text-slate-500">Unassigned</span>;
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-cyan-300 text-xs">
                            {dept.department_code ? `${dept.department_code} • ` : ''}{dept.name}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateShort(o.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setDeleteId(o)} 
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-panel-elevated border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={20} />
                <h2 className="text-lg font-bold text-foreground">Delete Officer</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-slate-300">
              Are you sure you want to delete officer <strong className="text-foreground">{deleteId.name}</strong>? This will revoke all their portal access.
            </p>
            {deleteError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex-1 btn bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose justify-center disabled:opacity-60 transition-all font-semibold text-sm"
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
