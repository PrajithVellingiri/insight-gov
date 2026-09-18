import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDepartments, getOfficers } from '@/api/admin.api';
import OfficerAnalytics from '@/components/admin/OfficerAnalytics';
import { Loader2, ChevronRight, Users } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';

export default function OfficerAnalyticsPage() {
  usePageTitle('Workload Analytics');
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#DDDCD7] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
            TELEMETRY & WORKLOADS
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
            OFFICER ANALYTICS
          </h1>
          <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
            Workload distribution, turnaround velocity, and triage rates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Department Filter & Officer List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-[#DDDCD7]">
            <label className="form-label">
              Filter by Department Jurisdiction
            </label>
            <select 
              className="form-input text-xs" 
              value={selectedDept} 
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedOfficer(null);
              }}
              disabled={loadingDepts}
            >
              <option value="">All Departments</option>
              {depts.map(d => (
                <option key={d.id} value={d.id}>
                  {d.department_code ? `${d.department_code} — ` : ''}{d.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-white rounded-md border border-[#DDDCD7] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DDDCD7] bg-[#F7F6F2] flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#181817] uppercase tracking-wider">
                Personnel ({officers.length})
              </span>
              <span className="text-[10px] font-mono text-[#6F6F6A]">Select to inspect</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-[#DDDCD7]">
              {loadingOfficers ? (
                <div className="p-8 text-center text-[#6F6F6A] flex items-center justify-center gap-2 font-mono text-xs">
                  <Loader2 size={16} className="animate-spin text-[#181817]" />
                  <span>Loading personnel...</span>
                </div>
              ) : officers.length === 0 ? (
                <div className="p-8 text-center text-[#6F6F6A] text-xs font-mono">
                  No officers found.
                </div>
              ) : (
                <ul className="divide-y divide-[#DDDCD7]">
                  {officers.map(officer => {
                    const isSelected = selectedOfficer?.id === officer.id;
                    return (
                      <li key={officer.id}>
                        <button
                          onClick={() => setSelectedOfficer(officer)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'bg-[#181817] text-white' 
                              : 'text-[#181817] hover:bg-[#F7F6F2]'
                          }`}
                        >
                          <div>
                            <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#181817]'}`}>
                              {officer.name}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
                              {officer.email}
                            </div>
                          </div>
                          <ChevronRight 
                            size={14} 
                            className={isSelected ? 'text-[#F05A3C]' : 'text-[#6F6F6A]'} 
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column: Selected Officer Analytics Detail (8 cols) */}
        <div className="lg:col-span-8">
          <OfficerAnalytics officer={selectedOfficer} />
        </div>
      </div>
    </div>
  );
}
