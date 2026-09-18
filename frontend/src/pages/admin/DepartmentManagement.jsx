import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, deleteDepartment } from '@/api/admin.api';
import { Plus, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';

export default function DepartmentManagement() {
  usePageTitle('Departments Directory');
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#DDDCD7] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
            ADMINISTRATION DIRECTORY
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
            DEPARTMENTS
          </h1>
          <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
            {depts.length} departments currently mapped for autonomous intake
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Register Department Form (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-md border border-[#DDDCD7] shadow-card">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817] flex items-center gap-2 mb-4 border-b border-[#DDDCD7] pb-2">
            <Plus size={14} className="text-[#F05A3C]" /> Add Department
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Department Code (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. TN042" 
                value={form.department_code} 
                onChange={e => setForm({...form, department_code: e.target.value})} 
              />
            </div>
            <div>
              <label className="form-label">Department Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Finance Department" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                required 
              />
            </div>
            {error && (
              <div className="text-xs text-[#E13B22] bg-[#FFF0EB] border border-[#F05A3C]/30 p-2.5 rounded font-mono">
                {error}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full py-2.5 text-xs font-bold uppercase">
              {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Register Department'}
            </button>
          </form>
        </div>

        {/* Directory List with Bold Orange Numbers (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-md border border-[#DDDCD7] divide-y divide-[#DDDCD7]">
          {isLoading ? (
            <div className="text-center py-12 text-[#6F6F6A] font-mono text-xs">
              <Loader2 size={18} className="animate-spin inline mr-2 text-[#181817]" />
              LOADING DIRECTORY...
            </div>
          ) : depts.length === 0 ? (
            <div className="text-center py-12 text-[#6F6F6A] font-mono text-xs">
              NO DEPARTMENTS REGISTERED IN DIRECTORY.
            </div>
          ) : (
            depts.map((d, index) => {
              const numStr = String(index + 1).padStart(2, '0');
              return (
                <div key={d.id} className="p-5 flex items-center justify-between gap-4 hover:bg-[#FFF0EB]/20 transition-colors group">
                  <div className="flex items-start gap-4">
                    <span className="text-lg font-mono font-extrabold text-[#F05A3C] w-8 flex-shrink-0">
                      {numStr}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#181817] group-hover:text-[#F05A3C] transition-colors">
                          {d.name}
                        </h3>
                        {d.department_code && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F7F6F2] border border-[#DDDCD7] text-[#6F6F6A]">
                            {d.department_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6F6F6A] mt-0.5">
                        Autonomous classification jurisdiction queue
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setDeleteId(d)} 
                    className="text-[#6F6F6A] hover:text-[#E13B22] p-1.5 rounded transition-colors"
                    title="Delete Department"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#181817]/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DDDCD7] rounded-md shadow-elevated w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#E13B22]">
                <AlertTriangle size={16} />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817]">Delete Department</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-[#6F6F6A] hover:text-[#181817]">
                <X size={15} />
              </button>
            </div>
            
            <p className="text-xs text-[#6F6F6A]">
              Confirm removal of <strong className="text-[#181817]">{deleteId.name}</strong> from the intake directory?
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
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
