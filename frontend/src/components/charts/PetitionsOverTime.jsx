import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#181817] text-white border border-[#292927] rounded px-3.5 py-2 shadow-elevated">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#A3A39E] mb-0.5">{label}</p>
      <p className="text-sm font-mono font-bold text-[#F05A3C]">
        {payload[0].value} <span className="text-xs text-[#A3A39E] font-normal">records</span>
      </p>
    </div>
  );
};

export default function PetitionsOverTime({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-xs font-mono text-[#6F6F6A]">NO HISTORICAL TREND RECORDED.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="civicTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#181817" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#181817" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 2" stroke="#DDDCD7" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6F6F6A', fontFamily: 'monospace' }} stroke="#DDDCD7" dy={8} />
        <YAxis tick={{ fontSize: 10, fill: '#6F6F6A', fontFamily: 'monospace' }} stroke="transparent" allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F05A3C', strokeWidth: 1, strokeDasharray: '2 2' }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#181817"
          strokeWidth={2}
          fill="url(#civicTrendFill)"
          activeDot={{
            r: 4,
            fill: '#F05A3C',
            stroke: '#181817',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
