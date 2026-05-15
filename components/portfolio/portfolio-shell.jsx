import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { arcTestnet } from "../../lib/arc-chain";
import {
  PORTFOLIO_WINDOWS,
  buildAllocationSeries,
  buildFlowSeries,
  buildOverviewMetrics,
  buildPortfolioInsights,
  buildSecuritySignals,
  downloadActivityCsv,
  filterActivityByWindow,
  getActivityKind
} from "../../lib/portfolio-page";
import BridgeToArcPanel from "../bridge-to-arc-panel";
import SendUsdcComposer from "../send-usdc-composer";
import PortfolioActivityPanel from "./portfolio-activity-panel";
import PortfolioAnalyticsPanel from "./portfolio-analytics-panel";
import PortfolioAssetsPanel from "./portfolio-assets-panel";
import PortfolioInsightsPanel from "./portfolio-insights-panel";
import PortfolioLivePanel from "./portfolio-live-panel";
import PortfolioOverviewCard from "./portfolio-overview-card";
import PortfolioSecurityPanel from "./portfolio-security-panel";

export default function PortfolioShell({
  walletSnapshot,
  portfolio,
  activity,
  activityStatus,
  activityError
}) {
  const [assetQuery, setAssetQuery] = useState("");
  const [selectedWindow, setSelectedWindow] = useState("24h");
  const [activityFilter, setActivityFilter] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);

  const filteredAssets = useMemo(() => {
    const assets = Array.isArray(portfolio?.assets) ? portfolio.assets : [];
    const query = assetQuery.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) =>
      [asset.name, asset.symbol, asset.tokenType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [assetQuery, portfolio?.assets]);

  const filteredActivity = useMemo(() => {
    const withinWindow = filterActivityByWindow(activity, selectedWindow);

    if (activityFilter === "all") {
      return withinWindow;
    }

    return withinWindow.filter(
      (item) => getActivityKind(item) === activityFilter
    );
  }, [activity, activityFilter, selectedWindow]);

  const allocationSeries = useMemo(
    () => buildAllocationSeries(portfolio),
    [portfolio]
  );
  const flowSeries = useMemo(
    () => buildFlowSeries(activity, selectedWindow),
    [activity, selectedWindow]
  );
  const overview = useMemo(
    () => buildOverviewMetrics(walletSnapshot, portfolio, activity),
    [activity, portfolio, walletSnapshot]
  );
  const insights = useMemo(
    () => buildPortfolioInsights(walletSnapshot, portfolio, activity),
    [activity, portfolio, walletSnapshot]
  );
  const security = useMemo(
    () => buildSecuritySignals(walletSnapshot, activityStatus, insights),
    [activityStatus, insights, walletSnapshot]
  );

  const handleCopyAddress = async () => {
    if (!walletSnapshot?.address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(walletSnapshot.address);
    } catch {}
  };

  const handleReceive = async () => {
    await handleCopyAddress();
  };

  const handleOpenBridge = () => {
    const section = document.getElementById("portfolio-bridge");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleViewAddress = () => {
    if (!walletSnapshot?.address) {
      return;
    }

    window.open(
      `${arcTestnet.blockExplorers.default.url}/address/${walletSnapshot.address}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleExport = () => {
    downloadActivityCsv(filteredActivity, walletSnapshot?.address || "");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <div className="space-y-6">
        <PortfolioOverviewCard
          walletSnapshot={walletSnapshot}
          overview={overview}
          onCopyAddress={handleCopyAddress}
          onReceive={handleReceive}
          onOpenSend={() => setComposerOpen(true)}
          onOpenBridge={handleOpenBridge}
          onViewAddress={handleViewAddress}
        />

        <AnimatePanel open={composerOpen}>
          <SendUsdcComposer
            open={composerOpen}
            walletAddress={walletSnapshot?.address}
            onClose={() => setComposerOpen(false)}
          />
        </AnimatePanel>

        <BridgeToArcPanel
          sectionId="portfolio-bridge"
          compact
          walletSnapshot={walletSnapshot}
          title="Bridge testnet USDC into Arc"
          subtitle="Use Circle App Kit to move USDC from Ethereum Sepolia or Base Sepolia into Arc Testnet."
        />

        <PortfolioAssetsPanel
          isSignedIn={walletSnapshot?.isSignedIn}
          portfolio={portfolio}
          assets={filteredAssets}
          assetQuery={assetQuery}
          onAssetQueryChange={setAssetQuery}
        />

        <PortfolioAnalyticsPanel
          isSignedIn={walletSnapshot?.isSignedIn}
          selectedWindow={selectedWindow}
          onWindowChange={setSelectedWindow}
          windows={PORTFOLIO_WINDOWS}
          allocationSeries={allocationSeries}
          flowSeries={flowSeries}
        />

        <PortfolioActivityPanel
          isSignedIn={walletSnapshot?.isSignedIn}
          activity={filteredActivity}
          status={activityStatus}
          error={activityError}
          selectedFilter={activityFilter}
          onFilterChange={setActivityFilter}
          onExport={handleExport}
        />
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-[28px] border border-white/10 bg-arc-panel p-6 shadow-glass"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Why Arc
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Built for AI-native stablecoin wallets
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Arc combines a USDC gas model, fast deterministic settlement, and
            native financial primitives that map cleanly to AI wallet products.
          </p>
        </motion.div>

        <PortfolioInsightsPanel insights={insights} />
        <PortfolioSecurityPanel security={security} />
        <PortfolioLivePanel />
      </div>
    </div>
  );
}

function AnimatePanel({ open, children }) {
  if (!open) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
