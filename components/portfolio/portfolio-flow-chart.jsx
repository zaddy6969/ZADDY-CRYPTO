import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatUsdTick(value) {
  if (value === 0) {
    return "$0";
  }

  const numeric = Number(value || 0);
  const compact = Math.abs(numeric) >= 1000;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0
  }).format(numeric);
}

function FlowTooltip({ active, payload, label }) {
  const entry = payload?.[0];

  if (!active || !entry) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-sm text-slate-100 shadow-2xl">
      <p className="font-semibold">{label}</p>
      <p className="text-slate-300">
        Net flow {formatUsdTick(entry.payload.netFlowUsd)}
      </p>
      <p className="text-slate-400">
        Cumulative {formatUsdTick(entry.payload.cumulativeFlowUsd)}
      </p>
    </div>
  );
}

export default function PortfolioFlowChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#93a8cb", fontSize: 11 }}
        />
        <YAxis
          tickFormatter={formatUsdTick}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#93a8cb", fontSize: 11 }}
          width={48}
        />
        <Tooltip content={<FlowTooltip />} />
        <Line
          type="monotone"
          dataKey="cumulativeFlowUsd"
          stroke="#66b6ff"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: "#7ae7ff", stroke: "#0f172a" }}
          animationDuration={700}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
