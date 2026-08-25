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
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage government departments mapping for AI routing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card h-fit">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Plus size={18} className="text-primary-600" /> Add Department
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
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Department'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 card p-0 overflow-hidden h-fit">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Code</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
              ) : depts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No departments found.</td></tr>
              ) : (
                depts.map((d) => (
                  <tr key={d.id} className="hover:bg-muted">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.department_code}</td>
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2"><Building2 size={14} className="text-muted-foreground" /> {d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateShort(d.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(d)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
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
                <h2 className="text-lg font-bold text-foreground">Delete Department</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-muted-foreground hover:text-muted-foreground rounded-full p-1">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{deleteId.name}</strong>?
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
