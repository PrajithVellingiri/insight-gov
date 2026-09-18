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
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="page-header">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
            01 / ADMINISTRATION
          </span>
          <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight flex items-center gap-2.5">
            <Building2 size={26} className="text-[#315C4A]" />
            State Ministries & Departments
          </h1>
          <p className="text-sm text-[#68716B] mt-1 max-w-xl leading-relaxed">
            Manage official government ministry targets, departmental identifiers, and routing queues.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white h-fit p-6 rounded-2xl border border-[#E5E5DE] shadow-card">
          <h2 className="text-sm font-bold text-[#202522] flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Plus size={16} className="text-[#315C4A]" /> Register Department
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Department Code (Optional)</label>
              <input type="text" className="form-input" placeholder="e.g. TN042" value={form.department_code} onChange={e => setForm({...form, department_code: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Department Name</label>
              <input type="text" className="form-input" placeholder="e.g. Health & Family Welfare" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            {error && (
              <div className="text-xs text-[#B91C1C] bg-[#FDF2F2] border border-[#FBD5D5] p-2.5 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Department'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-[#E5E5DE] shadow-card overflow-hidden h-fit">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8F7F2] border-b border-[#E5E5DE]">
              <tr>
                <th className="px-5 py-3.5 text-xs font-mono font-semibold text-[#68716B] uppercase tracking-wider w-24">Code</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider">Department</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider">Registered</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#68716B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5DE]">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-[#68716B]"><Loader2 size={18} className="animate-spin inline mr-2 text-[#315C4A]" />Loading ministries...</td></tr>
              ) : depts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-[#68716B]">No departments registered.</td></tr>
              ) : (
                depts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8F7F2]/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#68716B]">{d.department_code || '—'}</td>
                    <td className="px-5 py-3.5 font-medium text-[#202522]">
                      {d.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#68716B] text-xs font-mono">{formatDateShort(d.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => setDeleteId(d)} 
                        className="text-[#68716B] hover:text-[#B91C1C] p-1 rounded transition-colors"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#202522]/30 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5E5DE] rounded-2xl shadow-dropdown w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#C58B5B]">
                <AlertTriangle size={18} />
                <h2 className="text-base font-bold text-[#202522]">Delete Department</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-[#68716B] hover:text-[#202522] rounded-lg p-1">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-[#68716B]">
              Are you sure you want to remove <strong className="text-[#202522]">{deleteId.name}</strong> from the routing directory?
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
