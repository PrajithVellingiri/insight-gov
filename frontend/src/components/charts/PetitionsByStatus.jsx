import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending:      '#f59e0b',
  analysed:     '#3b82f6',
  under_review: '#6366f1',
  resolved:     '#10b981',
  rejected:     '#ef4444',
  duplicate:    '#a855f7',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl px-3.5 py-2">
      <p className="text-xs font-semibold text-foreground capitalize">{name?.replace('_', ' ')}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color: STATUS_COLORS[name] || '#3b82f6' }}>{value} petitions</p>
    </div>
  );
};

export default function PetitionsByStatus({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No status distribution data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={54}
          outerRadius={84}
          paddingAngle={4}
          stroke="#070d1a"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#64748b'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs capitalize font-medium text-slate-300">{value?.replace('_', ' ')}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
