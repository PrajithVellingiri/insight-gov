import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, deleteDepartment } from '@/api/admin.api';
import { Building2, Plus, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';

export default function DepartmentManagement() {
  usePageTitle('Departments');
  const queryClient = useQueryClient();
  const { data: depts = [], isLoading } = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const { mutateAsync: add, isPending } = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });
  const { mutateAsync: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });

  const [form, setForm] = useState({ name: '', department_code: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError('Department Name is required.');
      return;
    }
    try {
      setError('');
      await add(form);
      setForm({ name: '', department_code: '' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create department.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteError('');
      await remove(deleteId.id);
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.detail || 'Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Building2 size={22} />
            </div>
            Departments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage state ministry mappings and autonomous AI routing targets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 glass-panel h-fit p-6 rounded-2xl border border-slate-800/80">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Plus size={18} className="text-blue-400" /> Add Department
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Department Code (Optional)</label>
              <input type="text" className="form-input" placeholder="e.g. TN042" value={form.department_code} onChange={e => setForm({...form, department_code: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Department Name</label>
              <input type="text" className="form-input" placeholder="e.g. Health & Welfare" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Department'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 glass-panel p-0 overflow-hidden h-fit rounded-2xl border border-slate-800/80 shadow-card-3d">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground"><Loader2 size={20} className="animate-spin inline mr-2 text-cyan-400" />Loading ministries...</td></tr>
              ) : depts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No departments registered.</td></tr>
              ) : (
                depts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">{d.department_code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" /> {d.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateShort(d.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setDeleteId(d)} 
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                        title="Delete Department"
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
                <h2 className="text-lg font-bold text-foreground">Delete Department</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <strong className="text-foreground">{deleteId.name}</strong>? This action cannot be undone.
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
