import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-primary-700">{payload[0].value} petitions</p>
    </div>
  );
};

export default function PetitionsOverTime({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#1d4ed8"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
