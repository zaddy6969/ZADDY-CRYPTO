import { motion } from "framer-motion";
import { formatUsdValue } from "../../lib/arc-portfolio";
import { Badge } from "../ui/badge";

function AssetSkeleton() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="h-11 w-11 rounded-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-4 h-4 w-24 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-3 h-7 w-28 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-3 h-4 w-20 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

function toneForAccent(accent) {
  if (accent === "blue") {
    return "blue";
  }

  if (accent === "violet") {
    return "violet";
  }

  if (accent === "cyan") {
    return "green";
  }

  return "neutral";
}

export default function PortfolioAssetsPanel({
  isSignedIn,
  portfolio,
  assets,
  assetQuery,
  onAssetQueryChange
}) {
  const isLoading =
    portfolio?.status === "loading" && assets.length === 0 && !portfolio?.nativeAsset;
  const showError = portfolio?.status === "error" && assets.length === 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.32, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Assets
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Live supported Arc holdings
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Token balances are fetched from Arc Testnet using native balance reads
            and multicall-backed ERC-20 checks.
          </p>
        </div>

        <label className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-slate-400">Search</span>
          <input
            value={assetQuery}
            onChange={(event) => onAssetQueryChange(event.target.value)}
            placeholder="USDC, EURC, native..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      {!isSignedIn ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-semibold text-white">
            Connect wallet to view portfolio.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Asset cards, balances, and allocation will appear after your Arc wallet
            connection is active.
          </p>
        </div>
      ) : isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((item) => (
            <AssetSkeleton key={item} />
          ))}
        </div>
      ) : showError ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-semibold text-white">
            Asset sync is taking longer than expected.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {portfolio?.error || "Please try again in a moment."}
          </p>
        </div>
      ) : assets.length === 0 && assetQuery.trim() ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-semibold text-white">No assets match that search.</p>
          <p className="mt-2 text-sm text-slate-400">
            Try another token name or symbol to explore the visible Arc holdings.
          </p>
        </div>
      ) : assets.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-semibold text-white">No supported assets found.</p>
          <p className="mt-2 text-sm text-slate-400">
            This wallet is connected, but none of the currently tracked Arc assets
            were found in the latest portfolio refresh.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset, index) => (
            <motion.article
              key={`${asset.address || asset.key}-${asset.symbol}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.02 * index, duration: 0.25 }}
              className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-sky-300/20 hover:bg-white/[0.065]"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-slate-950 shadow-glow"
                  style={{
                    background:
                      asset.accent === "violet"
                        ? "linear-gradient(135deg,#cfb4ff,#8e6bff)"
                        : asset.accent === "cyan"
                          ? "linear-gradient(135deg,#90efff,#50b8ff)"
                          : "linear-gradient(135deg,#7dc8ff,#5a94ff)"
                  }}
                >
                  {asset.logoLabel || asset.symbol || "TOK"}
                </div>
                <Badge tone={toneForAccent(asset.accent)}>
                  {asset.allocation > 0 ? `${asset.allocation.toFixed(1)}%` : "Tracked"}
                </Badge>
              </div>

              <div className="mt-5">
                <p className="text-lg font-semibold text-white">
                  {asset.symbol || "TOKEN"}
                </p>
                <p className="mt-1 text-sm text-slate-400">{asset.name}</p>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                  <span>Balance</span>
                  <span className="font-mono text-white">
                    {asset.balanceLabel} {asset.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                  <span>Estimated value</span>
                  <span className="font-mono text-white">
                    {asset.hasValue ? formatUsdValue(asset.valueUsd) : "Value syncing"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                  <span>Asset type</span>
                  <span className="text-right text-white/90">
                    {asset.tokenType || "Arc ecosystem asset"}
                  </span>
                </div>
              </div>

              {asset.usesFallbackMetadata ? (
                <p className="mt-4 text-xs leading-6 text-slate-500">
                  Metadata is using the fallback token profile until the next Arc RPC
                  refresh confirms the token contract fields.
                </p>
              ) : null}
            </motion.article>
          ))}
        </div>
      )}
    </motion.section>
  );
}
