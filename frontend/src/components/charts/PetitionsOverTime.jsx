import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color: '#00e599', textShadow: '0 0 10px rgba(0, 229, 153, 0.4)' }}>
        {payload[0].value} <span className="text-xs text-muted-foreground font-medium ml-1">petitions</span>
      </p>
    </div>
  );
};

export default function PetitionsOverTime({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e599" stopOpacity={0.6}/>
            <stop offset="70%" stopColor="#00e599" stopOpacity={0.05}/>
            <stop offset="100%" stopColor="#00e599" stopOpacity={0}/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} stroke="transparent" dy={10} />
        <YAxis tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} stroke="transparent" allowDecimals={false} dx={-10} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#00e59940', strokeWidth: 1, strokeDasharray: '5 5' }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#00e599"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorCount)"
          style={{ filter: 'url(#glow)' }}
          activeDot={{ r: 5, fill: '#00e599', stroke: '#00e599', strokeWidth: 4, strokeOpacity: 0.3, style: { filter: 'drop-shadow(0px 0px 8px #00e599)' } }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
