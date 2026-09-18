import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending:      '#F05A3C', // Orange
  analysed:     '#FF7A59', // Secondary Orange
  under_review: '#FF7A59',
  resolved:     '#181817', // Charcoal
  rejected:     '#E13B22', // Muted Red
  duplicate:    '#6F6F6A', // Gray
  withdrawn:    '#A3A39E',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-[#181817] text-white border border-[#292927] rounded px-3 py-1.5 shadow-elevated">
      <p className="text-[10px] font-mono uppercase text-[#A3A39E]">{name?.replace('_', ' ')}</p>
      <p className="text-xs font-bold font-mono text-[#F05A3C]">{value} applications</p>
    </div>
  );
};

export default function PetitionsByStatus({ data = [] }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-xs font-mono text-[#6F6F6A]">NO DISTRIBUTION RECORDED.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="48%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          stroke="#FFFFFF"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#6F6F6A'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          formatter={(value) => (
            <span className="text-[11px] font-mono uppercase font-semibold text-[#181817]">{value?.replace('_', ' ')}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
