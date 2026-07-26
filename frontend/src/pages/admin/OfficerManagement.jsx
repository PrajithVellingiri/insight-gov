import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOfficers, createOfficer, getDepartments } from '@/api/admin.api';
import { Users, Plus, Loader2 } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function OfficerManagement() {
  const queryClient = useQueryClient();
  const { data: officers = [], isLoading: offLoading } = useQuery({ queryKey: ['admin', 'officers'], queryFn: getOfficers });
  const { data: depts = [] } = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const { mutateAsync: create, isPending } = useMutation({
    mutationFn: createOfficer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'officers'] }),
  });

  const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '' });
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department_id) {
      setError('All fields are required.');
      return;
    }
    setError('');
    try {
      await create(form);
      setForm({ name: '', email: '', password: '', department_id: '' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create officer');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage government officer accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleCreate} className="card bg-slate-50 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Add New Officer</h2>
            <div><label className="form-label">Name</label><input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label className="form-label">Password</label><input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
            <div>
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                <option value="">Select Dept...</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name/Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Department</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offLoading ? (
                <tr><td colSpan={3} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 text-slate-400">No officers found.</td></tr>
              ) : (
                officers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 flex items-center gap-2"><Users size={14} className="text-slate-400" /> {o.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{depts.find(d => d.id === o.department_id)?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateShort(o.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
