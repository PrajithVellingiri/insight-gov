import os

# 1. Restore backend/models/department.py
with open("backend/models/department.py", "w") as f:
    f.write("""import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    users = relationship("User", back_populates="department", lazy="select")
    petitions = relationship("Petition", back_populates="department", lazy="select")
""")

# 2. Restore backend/schemas/department.py
with open("backend/schemas/department.py", "w") as f:
    f.write("""from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    department_code: str


class DepartmentOut(BaseModel):
    id: UUID
    department_code: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True
""")

# 3. Restore backend/repositories/department_repo.py
with open("backend/repositories/department_repo.py", "w") as f:
    f.write("""from uuid import UUID

from sqlalchemy.orm import Session

from models.department import Department


class DepartmentRepository:
    def __init__(self, db: Session):
        self._db = db

    def get_all(self) -> list[Department]:
        return self._db.query(Department).all()

    def get_by_id(self, dept_id: UUID) -> Department | None:
        return self._db.query(Department).filter(Department.id == dept_id).first()

    def get_by_name(self, name: str) -> Department | None:
        return self._db.query(Department).filter(Department.name == name).first()

    def create(self, department: Department) -> Department:
        # Auto-generate department code if not provided
        if not department.department_code:
            from sqlalchemy import func
            # Simple fallback for now (TN001, TN002, etc.)
            max_code = self._db.query(func.max(Department.department_code)).scalar()
            if max_code and max_code.startswith("TN"):
                try:
                    next_num = int(max_code[2:]) + 1
                    department.department_code = f"TN{next_num:03d}"
                except ValueError:
                    count = self._db.query(Department).count()
                    department.department_code = f"TN{count + 1:03d}"
            else:
                count = self._db.query(Department).count()
                department.department_code = f"TN{count + 1:03d}"

        self._db.add(department)
        self._db.commit()
        self._db.refresh(department)
        return department

    def delete(self, dept_id: UUID) -> bool:
        dept = self.get_by_id(dept_id)
        if not dept:
            return False
        self._db.delete(dept)
        self._db.commit()
        return True
""")

# 4. Restore backend/schemas/petition.py
with open("backend/schemas/petition.py", "w") as f:
    f.write("""from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


class PetitionCreate(BaseModel):
    title: str
    description: str
    latitude: float | None = None
    longitude: float | None = None


class StatusUpdate(BaseModel):
    status: str
    remarks: str | None = None


class WithdrawRequest(BaseModel):
    reason: str


class PetitionHistoryOut(BaseModel):
    id: UUID
    petition_id: UUID
    changed_by_id: UUID
    changed_by_role: str
    old_status: str
    new_status: str
    remarks: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PetitionImageOut(BaseModel):
    id: UUID
    filename: str
    stored_path: str
    mime_type: str
    image_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PetitionOut(BaseModel):
    id: UUID
    title: str
    description: str
    status: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime

    submitter_id: UUID
    submitter_name: str | None = None
    submitter_email: str | None = None
    department_id: UUID | None
    # Department details (flattened)
    department_name: str | None = None
    department_code: str | None = None
    officer_id: UUID | None
    is_duplicate: bool
    withdrawal_reason: str | None = None
    images: list[PetitionImageOut] = []
    
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_relations(cls, data):
        # Extract submitter name
        if hasattr(data, "submitter") and data.submitter:
            data.submitter_name = data.submitter.name
            data.submitter_email = data.submitter.email
        elif isinstance(data, dict) and data.get("submitter"):
            data["submitter_name"] = data["submitter"]["name"]
            data["submitter_email"] = data["submitter"]["email"]

        # Extract department name and code
        if hasattr(data, "department") and data.department:
            data.department_name = data.department.name
            data.department_code = data.department.department_code
        elif isinstance(data, dict) and data.get("department"):
            data["department_name"] = data["department"]["name"]
            data["department_code"] = data["department"]["department_code"]

        return data


class AIAnalysisOut(BaseModel):
    id: UUID
    petition_id: UUID
    category: str | None
    confidence: float | None
    is_duplicate: bool
    duplicate_of_id: UUID | None
    explanation: str | None
    priority: str | None
    department: str | None

    model_config = ConfigDict(from_attributes=True)


class PetitionWithAnalysis(PetitionOut):
    ai_analysis: AIAnalysisOut | None = None

    model_config = ConfigDict(from_attributes=True)
""")

# 5. Restore frontend/src/components/petition/PetitionTable.jsx
with open("frontend/src/components/petition/PetitionTable.jsx", "w") as f:
    f.write("""import { formatDateShort } from '@/lib/utils';
import { FileText, MapPin, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusStyles = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  analysed: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  duplicate: 'bg-slate-100 text-slate-500 border-slate-200',
  withdrawn: 'bg-slate-50 text-slate-500 border-slate-200 line-through',
};

const priorityStyles = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function PetitionTable({ petitions, role }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground w-12 text-center">ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground min-w-[300px]">Details</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status & Priority</th>
              <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Submitter</th>
              <th className="px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Department</th>
              <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {petitions.map((p) => {
              const priority = p.priority || p.ai_analysis?.priority;
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono">
                    {p.id.split('-')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground truncate max-w-[300px] xl:max-w-[400px]">
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      {p.ai_analysis?.suggested_category && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} /> {p.ai_analysis.suggested_category}
                        </span>
                      )}
                      {(p.latitude && p.longitude) && (
                        <span className="flex items-center gap-1 text-primary-600/70">
                          <MapPin size={12} /> Location tagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyles[p.status] || statusStyles.pending}`}>
                        {p.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {priority && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityStyles[priority.toLowerCase()]}`}>
                          {priority} Priority
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="font-medium text-foreground">{p.submitter_name || 'Anonymous'}</div>
                    <div className="text-xs text-muted-foreground">{p.submitter_email}</div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                    {p.department_name ? `${p.department_code || ''} - ${p.department_name}` : p.ai_analysis?.department || '-'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDateShort(p.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      to={`/${role}/petitions/${p.id}`} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      View <ExternalLink size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
""")

# 6. Restore frontend/src/pages/admin/DepartmentManagement.jsx
with open("frontend/src/pages/admin/DepartmentManagement.jsx", "w") as f:
    f.write("""import { useState } from 'react';
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
    if (!form.name) return;
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
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage government departments mapping for AI routing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card h-fit">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
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
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : depts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">No departments found.</td></tr>
              ) : (
                depts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.department_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2"><Building2 size={14} className="text-slate-400" /> {d.name}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateShort(d.created_at)}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h2 className="text-lg font-bold text-slate-900">Delete Department</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-slate-400 hover:text-slate-600 rounded-full p-1">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600">
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
""")

# 7. Restore frontend/src/pages/admin/OfficerManagement.jsx
with open("frontend/src/pages/admin/OfficerManagement.jsx", "w") as f:
    f.write("""import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOfficers, createOfficer, getDepartments, deleteOfficer } from '@/api/admin.api';
import { Users, Plus, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';

export default function OfficerManagement() {
  usePageTitle('Officers');
  const queryClient = useQueryClient();
  const { data: officers = [], isLoading: offLoading } = useQuery({ queryKey: ['admin', 'officers'], queryFn: getOfficers });
  const { data: depts = [] } = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
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
    if (!form.name || !form.email || !form.password || !form.department_id) return;
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
          <h1 className="text-2xl font-bold text-slate-900">Officers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage government officers and assign departments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card h-fit">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
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
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name/Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Department</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">No officers found.</td></tr>
              ) : (
                officers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 flex items-center gap-2"><Users size={14} className="text-slate-400" /> {o.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{
                      (depts.find(d => d.id === o.department_id) 
                        ? `${depts.find(d => d.id === o.department_id).department_code} - ${depts.find(d => d.id === o.department_id).name}` 
                        : 'Unassigned')
                    }</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateShort(o.created_at)}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h2 className="text-lg font-bold text-slate-900">Delete Officer</h2>
              </div>
              <button onClick={() => { setDeleteId(null); setDeleteError(''); }} className="text-slate-400 hover:text-slate-600 rounded-full p-1">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600">
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
""")

# 8. Restore backend/inspect_data.py
with open("backend/inspect_data.py", "w") as f:
    f.write("""from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    res = conn.execute(text("SELECT id, name, department_code FROM departments ORDER BY created_at"))
    for row in res:
        print(row)
""")

# 9. Restore backend/alembic/versions/ab6b65f84608_add_department_code.py
with open("backend/alembic/versions/ab6b65f84608_add_department_code.py", "w") as f:
    f.write('"""add department_code\\n\\nRevision ID: ab6b65f84608\\nRevises: 24c4f0c75b03\\nCreate Date: 2026-08-02 19:18:14.096928+00:00\\n\\n"""\\nfrom typing import Sequence, Union\\n\\nfrom alembic import op\\nimport sqlalchemy as sa\\n\\n\\n# revision identifiers, used by Alembic.\\nrevision: str = \\\'ab6b65f84608\\\'\\ndown_revision: Union[str, None] = \\\'24c4f0c75b03\\\'\\nbranch_labels: Union[str, Sequence[str], None] = None\\ndepends_on: Union[str, Sequence[str], None] = None\\n\\n\\ndef upgrade() -> None:\\n    # ### commands auto generated by Alembic - please adjust! ###\\n    op.alter_column(\\\'departments\\\', \\\'department_code\\\',\\n               existing_type=sa.VARCHAR(length=10),\\n               nullable=True)\\n    op.drop_index(\\\'ix_departments_code\\\', table_name=\\\'departments\\\')\\n    # ### end Alembic commands ###\\n\\n\\ndef downgrade() -> None:\\n    # ### commands auto generated by Alembic - please adjust! ###\\n    op.create_index(\\\'ix_departments_code\\\', \\\'departments\\\', [\\\'department_code\\\'], unique=False)\\n    op.alter_column(\\\'departments\\\', \\\'department_code\\\',\\n               existing_type=sa.VARCHAR(length=10),\\n               nullable=False)\\n    # ### end Alembic commands ###\\n')
