import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
    return <div className="flex items-center justify-center h-48 text-xs font-mono text-[#6F6F6A]">NO DATA AVAILABLE</div>;
  }

  return (
    <div className="relative">
      <button 
        onClick={handleCopy}
        className="absolute -top-10 right-0 p-1.5 text-[#6F6F6A] hover:text-[#181817] transition-colors bg-white rounded border border-[#DDDCD7]"
        aria-label="Copy data"
        title="Copy data to clipboard"
      >
        {copied ? <Check size={14} className="text-[#F05A3C]" /> : <Copy size={14} />}
      </button>
      
      <div className="space-y-3 mt-4">
        {processedData.map((item, i) => {
          const percentage = Math.max((item.count / maxCount) * 100, 2);
          return (
            <div key={i} className="flex items-center gap-4 text-xs font-mono">
              <div 
                className="w-32 sm:w-40 shrink-0 truncate font-semibold text-[#181817]"
                title={item.category}
              >
                {getShortName(item.category)}
              </div>
              <div className="flex-1 flex items-center h-2.5 bg-[#EFEFEA] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#181817] hover:bg-[#F05A3C] transition-all duration-300 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-10 text-right shrink-0 font-bold text-[#181817]">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
