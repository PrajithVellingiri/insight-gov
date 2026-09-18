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
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity size={24} className="text-primary" />
            </div>
            Officer Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor individual officer workload and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 animate-fade-in-up delay-100">
          <div className="card">
            <label className="form-label">Filter by Department</label>
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
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-semibold text-sm">Officers ({officers.length})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {loadingOfficers ? (
                <div className="p-8 text-center text-muted-foreground flex justify-center"><Loader2 size={24} className="animate-spin" /></div>
              ) : officers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No officers found.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {officers.map(officer => (
                    <li key={officer.id}>
                      <button
                        onClick={() => setSelectedOfficer(officer)}
                        className={`w-full text-left p-4 flex items-center justify-between hover:bg-muted transition-colors ${selectedOfficer?.id === officer.id ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                      >
                        <div>
                          <div className="font-medium text-sm text-foreground">{officer.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{officer.email}</div>
                        </div>
                        <ChevronRight size={16} className={`text-muted-foreground transition-transform ${selectedOfficer?.id === officer.id ? 'translate-x-1 text-primary' : ''}`} />
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