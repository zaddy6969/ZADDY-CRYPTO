import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const AllocationChart = dynamic(
  () => import("./portfolio-allocation-chart"),
  { ssr: false }
);
const FlowChart = dynamic(() => import("./portfolio-flow-chart"), {
  ssr: false
});

export default function PortfolioAnalyticsPanel({
  isSignedIn,
  selectedWindow,
  onWindowChange,
  windows,
  allocationSeries,
  flowSeries
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.32, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Portfolio analytics
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Allocation and live wallet flow
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Allocation uses current visible balances. Flow tracks real supported Arc
            wallet movement over the selected time window.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {windows.map((window) => (
            <Button
              key={window.key}
              variant={selectedWindow === window.key ? "primary" : "secondary"}
              size="md"
              onClick={() => onWindowChange(window.key)}
            >
              {window.label}
            </Button>
          ))}
        </div>
      </div>

      {!isSignedIn ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-semibold text-white">
            Connect wallet to unlock analytics.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            The charts are generated from your live Arc balances and recent onchain
            wallet events.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Asset allocation</p>
                <p className="mt-1 text-sm text-slate-400">
                  Value-based where pricing is available, balance-based otherwise.
                </p>
              </div>
              <Badge tone="blue">{allocationSeries.length} assets</Badge>
            </div>

            {allocationSeries.length === 0 ? (
              <div className="mt-6 rounded-[20px] border border-white/10 bg-slate-950/30 p-6 text-sm text-slate-400">
                Asset allocation appears after supported Arc token balances are
                detected.
              </div>
            ) : (
              <div className="mt-4">
                <AllocationChart data={allocationSeries} />
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Net wallet flow</p>
                <p className="mt-1 text-sm text-slate-400">
                  Based on incoming and outgoing supported asset transfers on Arc.
                </p>
              </div>
              <Badge tone="violet">{selectedWindow.toUpperCase()}</Badge>
            </div>

            {flowSeries.length === 0 ? (
              <div className="mt-6 rounded-[20px] border border-white/10 bg-slate-950/30 p-6 text-sm text-slate-400">
                Flow data will appear once the wallet has recent supported Arc
                activity.
              </div>
            ) : (
              <div className="mt-4">
                <FlowChart data={flowSeries} />
              </div>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
