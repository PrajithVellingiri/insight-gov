import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-950/90 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] px-4 py-2.5">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold text-blue-400 flex items-baseline gap-1.5" style={{ textShadow: '0 0 12px rgba(59, 130, 246, 0.5)' }}>
        {payload[0].value} <span className="text-xs text-muted-foreground font-normal">petitions registered</span>
      </p>
    </div>
  );
};

export default function PetitionsOverTime({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No historical trend data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCountGov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.65} />
            <stop offset="60%" stopColor="#06b6d4" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#33415525" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} stroke="transparent" dy={10} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} stroke="transparent" allowDecimals={false} dx={-10} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f650', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorCountGov)"
          style={{ filter: 'url(#glowBlue)' }}
          activeDot={{
            r: 6,
            fill: '#06b6d4',
            stroke: '#1e3a8a',
            strokeWidth: 3,
            style: { filter: 'drop-shadow(0px 0px 8px #06b6d4)' },
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
