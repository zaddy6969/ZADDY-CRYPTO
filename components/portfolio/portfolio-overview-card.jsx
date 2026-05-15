import { motion } from "framer-motion";
import { WalletConnectCta } from "../wallet-connect";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export default function PortfolioOverviewCard({
  walletSnapshot,
  overview,
  onCopyAddress,
  onReceive,
  onOpenSend,
  onOpenSwapGuide,
  onViewAddress
}) {
  const isSignedIn = walletSnapshot?.isSignedIn;
  const isRefreshing = walletSnapshot?.balanceStatus === "refreshing";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(102,182,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(142,107,255,0.12),transparent_32%)]" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge tone={walletSnapshot?.onArc ? "blue" : "amber"}>
              {walletSnapshot?.onArc ? "Arc network live" : "Switch network"}
            </Badge>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                Wallet overview
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                A real-time portfolio view for Arc-native wallets.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Track supported Arc balances, recent wallet movement, and AI-readable
                context from one clean command center.
              </p>
            </div>
          </div>

          {!isSignedIn ? (
            <WalletConnectCta className="hero-actions-inline" />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onCopyAddress}>
                Copy address
              </Button>
              <Button variant="secondary" onClick={onViewAddress}>
                View on ArcScan
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Wallet
            </p>
            <p className="mt-3 font-mono text-sm text-white">
              {isSignedIn ? overview.walletLabel : "Connect wallet"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {isSignedIn
                ? "Connected through RainbowKit on Arc Testnet."
                : "Sign in with MetaMask or WalletConnect to unlock portfolio data."}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Total portfolio
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {isSignedIn ? overview.totalValueLabel : "--"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Estimated from live supported Arc asset balances.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              24h change
            </p>
            <div className="mt-3 flex items-center gap-2">
              <p className="text-2xl font-semibold text-white">
                {isSignedIn ? overview.dailyChangeLabel : "--"}
              </p>
              {isSignedIn ? (
                <Badge tone={overview.dailyChangePct >= 0 ? "green" : "red"}>
                  {overview.dailyChangePct >= 0 ? "Positive flow" : "Negative flow"}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Based on net onchain flow from recent supported Arc activity.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Network status
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {overview.networkStatus}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {isRefreshing
                ? "Wallet balances are refreshing against the latest Arc blocks."
                : "Arc uses USDC as the native gas token and value layer."}
            </p>
          </div>
        </div>

        {isSignedIn ? (
          <div className="flex flex-wrap gap-3">
            <Button onClick={onOpenSend}>Send</Button>
            <Button variant="secondary" onClick={onReceive}>
              Receive
            </Button>
            <Button variant="secondary" onClick={onOpenSwapGuide}>
              Swap
            </Button>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
