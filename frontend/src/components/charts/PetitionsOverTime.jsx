import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E5DE] rounded-xl shadow-card px-4 py-2.5">
      <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#68716B] mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[#315C4A]">
        {payload[0].value} <span className="text-xs text-[#68716B] font-normal">petitions recorded</span>
      </p>
    </div>
  );
};

export default function PetitionsOverTime({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-xs text-[#68716B]">No historical trend data recorded.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="govTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#315C4A" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#315C4A" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5DE" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#68716B' }} stroke="#E5E5DE" dy={8} />
        <YAxis tick={{ fontSize: 11, fill: '#68716B' }} stroke="transparent" allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#78917F', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#315C4A"
          strokeWidth={2}
          fill="url(#govTrendFill)"
          activeDot={{
            r: 4,
            fill: '#315C4A',
            stroke: '#FFFFFF',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
