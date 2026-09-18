import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function getShortName(name) {
  if (name === 'Others') return 'Others';
  if (name.includes('(PWD)')) return 'PWD';
  if (name.includes('(MSME)')) return 'MSME';
  
  let short = name.replace(' Department', '');
  short = short.replace(' and ', ' & ');
  
  const overrides = {
    'Home, Prohibition & Excise': 'Home & Excise',
    'Revenue & Disaster Management': 'Revenue',
    'Commercial Taxes & Registration': 'Commercial Taxes',
    'Human Resources Management': 'HR Management',
    'Health & Family Welfare': 'Health',
    'School Education': 'Education',
    'Social Welfare & Women Empowerment': 'Social Welfare',
    'Co-operation, Food & Consumer Protection': 'Food & Consumer',
    'Welfare of Differently Abled Persons': 'Diff. Abled',
    'Adi Dravidar & Tribal Welfare': 'Tribal Welfare',
    'Highways & Minor Ports': 'Roads & Highways',
    'Municipal Administration & Water Supply': 'Water Supply',
    'Housing & Urban Development': 'Housing',
    'Environment, Climate Change & Forests': 'Environment',
    'Industries, Investment Promotion & Commerce': 'Industries',
    'Rural Development & Panchayat Raj': 'Rural Development',
    'Information Technology & Digital Services': 'IT & Digital',
    'Planning, Development & Special Initiatives': 'Planning',
    'Special Programme Implementation': 'Special Prog.',
    'Agriculture - Farmers Welfare': 'Agriculture',
    'Animal Husbandry, Dairying, Fisheries & Fishermen Welfare': 'Animal Husbandry',
    'Labour Welfare & Skill Development': 'Labour Welfare',
    'Handlooms, Handicrafts, Textiles & Khadi': 'Textiles',
    'Tourism, Culture & Religious Endowments': 'Tourism',
    'Youth Welfare & Sports Development': 'Youth & Sports'
  };

  return overrides[short] || short;
}

export default function PetitionsByCategory({ data = [] }) {
  const [copied, setCopied] = useState(false);

  const processedData = useMemo(() => {
    if (!data.length) return [];
    const sorted = [...data].sort((a, b) => b.count - a.count);
    if (sorted.length <= 10) return sorted;
    const top10 = sorted.slice(0, 10);
    const othersCount = sorted.slice(10).reduce((sum, item) => sum + item.count, 0);
    return [...top10, { category: 'Others', count: othersCount }];
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(...processedData.map(d => d.count), 1);
  }, [processedData]);

  const handleCopy = () => {
    const text = processedData.map(d => `${d.category}: ${d.count}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!processedData.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data available</div>;
  }

  return (
    <div className="relative">
      <button 
        onClick={handleCopy}
        className="absolute -top-10 right-0 p-2 text-muted-foreground hover:text-primary-600 transition-colors bg-card hover:bg-muted rounded-lg border border-border shadow-sm"
        aria-label="Copy data"
      >
        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
      </button>
      
      <div className="space-y-3 mt-4">
        {processedData.map((item, i) => {
          // Add a tiny baseline percentage so even 1 has a visible bar
          const percentage = Math.max((item.count / maxCount) * 100, 2);
          return (
            <div key={i} className="flex items-center gap-4 text-sm">
              <div 
                className="w-32 sm:w-40 shrink-0 truncate font-medium text-foreground"
                title={item.category} // Tooltip with full name on hover
              >
                {getShortName(item.category)}
              </div>
              <div className="flex-1 flex items-center h-4 bg-[#EFF4F0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#315C4A] transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-right shrink-0 font-mono text-xs font-semibold text-[#202522]">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
