import { motion } from "framer-motion";
import { Badge } from "../ui/badge";

export default function PortfolioSecurityPanel({ security }) {
  const tone =
    security.score >= 80 ? "green" : security.score >= 55 ? "amber" : "red";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, duration: 0.32, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Security
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Session monitoring
          </h2>
        </div>
        <Badge tone={tone}>Score {security.score}</Badge>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Connected devices</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Current browser wallet session only. No background device sync is stored
            by this app.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Session status</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">{security.session}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Network status</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">{security.network}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Activity monitoring</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">{security.monitoring}</p>
        </div>
      </div>
    </motion.section>
  );
}
