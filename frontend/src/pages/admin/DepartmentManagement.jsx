import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment } from '@/api/admin.api';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const { data: depts = [], isLoading } = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const { mutateAsync: create, isPending } = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });

  const [name, setName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create({ name });
      setName('');
    } catch (err) {
      alert('Failed to create department');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage government departments.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="card flex items-end gap-4 bg-slate-50 border-dashed">
        <div className="flex-1">
          <label className="form-label">New Department Name</label>
          <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Department of Environment" />
        </div>
        <button type="submit" disabled={isPending || !name.trim()} className="btn-primary whitespace-nowrap">
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Department
        </button>
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : depts.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-slate-400">No departments found.</td></tr>
            ) : (
              depts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2"><Building2 size={14} className="text-slate-400" /> {d.name}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateShort(d.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
