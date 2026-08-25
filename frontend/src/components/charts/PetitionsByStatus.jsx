import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending:      '#f59e0b',
  analysed:     '#3b82f6',
  under_review: '#6366f1',
  resolved:     '#16a34a',
  rejected:     '#ef4444',
  duplicate:    '#f97316',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg shadow-card px-3 py-2">
      <p className="text-xs font-semibold text-foreground capitalize">{name?.replace('_', ' ')}</p>
      <p className="text-sm font-bold" style={{ color: STATUS_COLORS[name] }}>{value} petitions</p>
    </div>
  );
};

export default function PetitionsByStatus({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs capitalize text-muted-foreground">{value?.replace('_', ' ')}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
