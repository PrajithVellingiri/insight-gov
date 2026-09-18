import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDepartments, getOfficers } from '@/api/admin.api';
import OfficerAnalytics from '@/components/admin/OfficerAnalytics';
import { Loader2, ChevronRight, Activity } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';

export default function OfficerAnalyticsPage() {
  usePageTitle('Officer Analytics');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  const { data: depts = [], isLoading: loadingDepts } = useQuery({ 
    queryKey: ['admin', 'departments'], 
    queryFn: getDepartments 
  });

  const { data: officers = [], isLoading: loadingOfficers } = useQuery({
    queryKey: ['admin', 'officers', selectedDept],
    queryFn: () => getOfficers(selectedDept || null),
  });

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl shadow-glow-cyan">
              <Activity size={24} />
            </div>
            Officer Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor individual officer workload, performance metrics, and resolution turnaround.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 animate-fade-in-up delay-100">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
            <label className="form-label text-slate-300">Filter by Department</label>
            <select 
              className="form-input" 
              value={selectedDept} 
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedOfficer(null);
              }}
              disabled={loadingDepts}
            >
              <option value="">All Departments</option>
              {depts.map(d => (
                <option key={d.id} value={d.id}>{d.department_code ? `${d.department_code} - ` : ''}{d.name}</option>
              ))}
            </select>
          </div>
          
          <div className="glass-panel p-0 overflow-hidden rounded-2xl border border-slate-800/80 shadow-card-3d">
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Officers ({officers.length})</h3>
              <span className="text-xs text-slate-400">Select to inspect</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60">
              {loadingOfficers ? (
                <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin text-cyan-400" />
                  <span>Loading personnel...</span>
                </div>
              ) : officers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No officers found for selected filter.</div>
              ) : (
                <ul className="divide-y divide-slate-800/60">
                  {officers.map(officer => (
                    <li key={officer.id}>
                      <button
                        onClick={() => setSelectedOfficer(officer)}
                        className={`w-full text-left p-4 flex items-center justify-between hover:bg-slate-800/40 transition-all ${
                          selectedOfficer?.id === officer.id 
                            ? 'bg-blue-500/10 border-l-4 border-cyan-400 text-white shadow-inner' 
                            : 'border-l-4 border-transparent text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm text-foreground">{officer.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{officer.email}</div>
                        </div>
                        <ChevronRight 
                          size={16} 
                          className={`transition-transform ${
                            selectedOfficer?.id === officer.id ? 'translate-x-1 text-cyan-400' : 'text-slate-500'
                          }`} 
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 animate-fade-in-up delay-200">
          <OfficerAnalytics officer={selectedOfficer} />
        </div>
      </div>
    </div>
  );
}