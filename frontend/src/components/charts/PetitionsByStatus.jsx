import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending:      '#C58B5B', // Terracotta
  analysed:     '#78917F', // Sage
  under_review: '#78917F', // Sage
  resolved:     '#315C4A', // Forest Green
  rejected:     '#B91C1C', // Muted Red
  duplicate:    '#C8A96B', // Soft Gold
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-[#E5E5DE] rounded-xl shadow-card px-3.5 py-2">
      <p className="text-xs font-semibold text-[#202522] capitalize">{name?.replace('_', ' ')}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color: STATUS_COLORS[name] || '#315C4A' }}>{value} petitions</p>
    </div>
  );
};

export default function PetitionsByStatus({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-xs text-[#68716B]">No status distribution data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="48%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          stroke="#FFFFFF"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#78917F'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          formatter={(value) => (
            <span className="text-xs capitalize font-medium text-[#68716B]">{value?.replace('_', ' ')}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
