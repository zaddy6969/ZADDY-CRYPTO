import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

const COLORS = {
  blue: "#66b6ff",
  violet: "#8e6bff",
  cyan: "#7ae7ff",
  neutral: "#9db0d6"
};

function AllocationTooltip({ active, payload }) {
  const entry = payload?.[0]?.payload;

  if (!active || !entry) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-sm text-slate-100 shadow-2xl">
      <p className="font-semibold">{entry.name}</p>
      <p className="text-slate-300">{entry.valueLabel}</p>
    </div>
  );
}

export default function PortfolioAllocationChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={72}
          outerRadius={108}
          paddingAngle={4}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          animationDuration={650}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.accent] || COLORS.neutral}
            />
          ))}
        </Pie>
        <Tooltip content={<AllocationTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
