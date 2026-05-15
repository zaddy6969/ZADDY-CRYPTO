import { motion } from "framer-motion";
import { getActivityKind } from "../../lib/portfolio-page";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "received", label: "Received" },
  { key: "approval", label: "Approval" }
];

function toneForKind(kind) {
  if (kind === "sent") {
    return "red";
  }

  if (kind === "received") {
    return "green";
  }

  if (kind === "approval") {
    return "violet";
  }

  return "blue";
}

function ActivitySkeleton() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="h-4 w-24 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-4 h-6 w-1/2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-3 h-4 w-4/5 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

export default function PortfolioActivityPanel({
  isSignedIn,
  activity,
  status,
  error,
  selectedFilter,
  onFilterChange,
  onExport
}) {
  const isInitialLoading = status === "loading" && activity.length === 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.32, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Transaction activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Wallet feed with Arc context
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Recent supported transfers and approvals, normalized into a cleaner
            wallet timeline.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? "primary" : "secondary"}
              onClick={() => onFilterChange(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
          <Button variant="secondary" onClick={onExport} disabled={!activity.length}>
            Export
          </Button>
        </div>
      </div>

      {!isSignedIn ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-semibold text-white">
            Connect wallet to view activity.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Recent transactions will populate here after the wallet is connected.
          </p>
        </div>
      ) : isInitialLoading ? (
        <div className="mt-6 grid gap-4">
          {[0, 1, 2].map((item) => (
            <ActivitySkeleton key={item} />
          ))}
        </div>
      ) : status === "error" ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-semibold text-white">
            Activity temporarily unavailable.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {error || "Please try again later."}
          </p>
        </div>
      ) : activity.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-semibold text-white">No transactions found.</p>
          <p className="mt-2 text-sm text-slate-400">
            No supported Arc wallet activity was found in the latest safe lookback
            window.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {activity.map((item, index) => {
            const kind = getActivityKind(item);

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * index, duration: 0.22 }}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-sky-300/20 hover:bg-white/[0.065]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={toneForKind(kind)}>
                        {kind === "approval"
                          ? "Approval"
                          : kind === "received"
                            ? "Received"
                            : kind === "sent"
                              ? "Sent"
                              : item.type}
                      </Badge>
                      <Badge tone="neutral">{item.status || "Confirmed"}</Badge>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{item.summary}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-400">
                        {item.amount || "Tracked contract activity"} · Block{" "}
                        {item.blockNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-left lg:text-right">
                    <p className="font-mono text-sm text-white">{item.txHashShort}</p>
                    <p className="text-sm text-slate-400">{item.timeLabel}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <span>Token: {item.token || "Contract"}</span>
                    <span>
                      Counterparty: {item.counterparty ? item.counterparty : "Not available"}
                    </span>
                  </div>
                  <a
                    href={item.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sky-200 underline decoration-white/10 underline-offset-4"
                  >
                    View on ArcScan
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
