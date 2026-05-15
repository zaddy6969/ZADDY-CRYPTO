import { motion } from "framer-motion";
import { ARC_TESTNET_INFO_ITEMS } from "../../lib/arc-chain";
import { Badge } from "../ui/badge";

export default function PortfolioLivePanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.32, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Live on Arc Testnet
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Network details
          </h2>
        </div>
        <Badge tone="blue">Arc ecosystem</Badge>
      </div>

      <div className="mt-6 grid gap-3">
        {ARC_TESTNET_INFO_ITEMS.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-white/10 bg-white/5 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {item.label}
            </p>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-sm text-slate-100 underline decoration-white/10 underline-offset-4"
              >
                {item.value}
              </a>
            ) : (
              <p className="mt-2 text-sm text-slate-100">{item.value}</p>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
