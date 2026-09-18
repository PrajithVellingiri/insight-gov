import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDepartments, getOfficers } from '@/api/admin.api';
import OfficerAnalytics from '@/components/admin/OfficerAnalytics';
import { Loader2, ChevronRight, Activity, Users } from 'lucide-react';
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#E5E5DE] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#68716B]">
            04 / Performance Audit
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F0] border border-[#D4E2D8] flex items-center justify-center text-[#315C4A]">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#202522] tracking-tight">Officer Analytics</h1>
              <p className="text-sm text-[#68716B] mt-0.5">
                Monitor individual officer workload, performance metrics, and resolution turnaround.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Department Filter & Officer List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#68716B] mb-2">
              Filter by Department
            </label>
            <select 
              className="w-full px-3 py-2 text-sm bg-[#F8F7F2] border border-[#E5E5DE] rounded-lg text-[#202522] focus:outline-none focus:border-[#315C4A] focus:bg-white transition-colors" 
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
                  {d.department_code ? `${d.department_code} - ` : ''}{d.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E5DE] bg-[#F8F7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-[#315C4A]" />
                <h3 className="font-semibold text-xs text-[#202522] uppercase tracking-wider">
                  Officers ({officers.length})
                </h3>
              </div>
              <span className="text-[11px] text-[#68716B]">Select to inspect</span>
            </div>

            <div className="max-h-[520px] overflow-y-auto divide-y divide-[#E5E5DE]">
              {loadingOfficers ? (
                <div className="p-8 text-center text-[#68716B] flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin text-[#315C4A]" />
                  <span className="text-xs">Loading personnel...</span>
                </div>
              ) : officers.length === 0 ? (
                <div className="p-8 text-center text-[#68716B] text-xs">
                  No officers found for selected department.
                </div>
              ) : (
                <ul className="divide-y divide-[#E5E5DE]">
                  {officers.map(officer => {
                    const isSelected = selectedOfficer?.id === officer.id;
                    return (
                      <li key={officer.id}>
                        <button
                          onClick={() => setSelectedOfficer(officer)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all ${
                            isSelected 
                              ? 'bg-[#EFF4F0] border-l-4 border-[#315C4A] text-[#202522]' 
                              : 'border-l-4 border-transparent text-[#202522] hover:bg-[#F8F7F2]'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-medium ${isSelected ? 'text-[#315C4A] font-semibold' : 'text-[#202522]'}`}>
                              {officer.name}
                            </div>
                            <div className="text-xs text-[#68716B] mt-0.5 font-mono">{officer.email}</div>
                          </div>
                          <ChevronRight 
                            size={15} 
                            className={`transition-transform ${
                              isSelected ? 'translate-x-1 text-[#315C4A]' : 'text-[#68716B]/50'
                            }`} 
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
        
        {/* Right Column: Selected Officer Analytics Detail */}
        <div className="lg:col-span-2">
          <OfficerAnalytics officer={selectedOfficer} />
        </div>
      </div>
    </div>
  );
}
