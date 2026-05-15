import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "../ui/badge";

export default function PortfolioInsightsPanel({ insights }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.32, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            AI insights
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Wallet summary
          </h2>
        </div>
        <Badge tone={insights.riskTone}>Risk {insights.riskLabel}</Badge>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">AI wallet summary</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">{insights.summary}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Spending analysis</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">{insights.spending}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Diversification</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            {insights.diversification}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {insights.stableAllocation}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Largest visible holding</p>
          <p className="mt-2 font-mono text-sm text-slate-100">{insights.mostHeldLabel}</p>
        </div>
      </div>

      <Link
        href="/"
        className="mt-5 inline-flex text-sm font-medium text-sky-200 underline decoration-white/10 underline-offset-4"
      >
        Open full AI wallet assistant
      </Link>
    </motion.section>
  );
}
