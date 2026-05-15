import { formatTokenBalance, formatUsdValue, shortAddress } from "./arc-portfolio";
import { arcTestnet } from "./arc-chain";

export const PORTFOLIO_WINDOWS = [
  { key: "24h", label: "24H", durationMs: 24 * 60 * 60 * 1000, buckets: 12 },
  { key: "7d", label: "7D", durationMs: 7 * 24 * 60 * 60 * 1000, buckets: 14 },
  { key: "30d", label: "30D", durationMs: 30 * 24 * 60 * 60 * 1000, buckets: 15 }
];

export function formatPercentage(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  const absolute = Math.abs(value);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const digits = absolute >= 10 ? 1 : 2;

  return `${sign}${absolute.toFixed(digits)}%`;
}

export function getActivityKind(item) {
  const value = String(item?.kind || item?.type || "").toLowerCase();

  if (value.includes("received") || value.includes("incoming")) {
    return "received";
  }

  if (value.includes("sent") || value.includes("outgoing")) {
    return "sent";
  }

  if (value.includes("swap")) {
    return "swap";
  }

  if (value.includes("approval")) {
    return "approval";
  }

  return "other";
}

function getWindowDefinition(windowKey) {
  return (
    PORTFOLIO_WINDOWS.find((item) => item.key === windowKey) || PORTFOLIO_WINDOWS[0]
  );
}

function resolveAssetComparableValue(asset) {
  if (typeof asset?.valueUsd === "number" && Number.isFinite(asset.valueUsd)) {
    return asset.valueUsd;
  }

  const numericBalance = Number(asset?.balance || 0);
  return Number.isFinite(numericBalance) ? numericBalance : 0;
}

export function buildAllocationSeries(portfolio) {
  const assets = Array.isArray(portfolio?.assets) ? portfolio.assets : [];

  return assets
    .map((asset) => ({
      name: asset.symbol || asset.name || "Asset",
      value: resolveAssetComparableValue(asset),
      balanceLabel: asset.balanceLabel,
      valueLabel:
        typeof asset.valueUsd === "number" && Number.isFinite(asset.valueUsd)
          ? formatUsdValue(asset.valueUsd)
          : `${formatTokenBalance(asset.balance)} ${asset.symbol || "TOKEN"}`,
      accent: asset.accent || "neutral"
    }))
    .filter((asset) => asset.value > 0);
}

function getActivityUsdValue(item) {
  const numeric = Number(item?.amountValue || 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  const token = String(item?.token || "").toUpperCase();

  if (token === "USDC" || token === arcTestnet.nativeCurrency.symbol.toUpperCase()) {
    return numeric;
  }

  if (token === "USYC") {
    return numeric;
  }

  return 0;
}

export function filterActivityByWindow(activity, windowKey) {
  const definition = getWindowDefinition(windowKey);
  const now = Date.now();
  const start = now - definition.durationMs;

  return (Array.isArray(activity) ? activity : []).filter((item) => {
    if (!item?.timestampMs) {
      return definition.key === "30d";
    }

    return item.timestampMs >= start;
  });
}

export function buildFlowSeries(activity, windowKey) {
  const definition = getWindowDefinition(windowKey);
  const now = Date.now();
  const start = now - definition.durationMs;
  const bucketSize = definition.durationMs / definition.buckets;
  const seed = Array.from({ length: definition.buckets }, (_, index) => {
    const bucketStart = start + bucketSize * index;

    return {
      label:
        definition.key === "24h"
          ? new Intl.DateTimeFormat("en-US", {
              hour: "numeric"
            }).format(bucketStart)
          : new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric"
            }).format(bucketStart),
      netFlowUsd: 0,
      txCount: 0
    };
  });

  const windowedActivity = filterActivityByWindow(activity, windowKey);

  for (const item of windowedActivity) {
    if (!item?.timestampMs) {
      continue;
    }

    const bucketIndex = Math.min(
      Math.floor((item.timestampMs - start) / bucketSize),
      definition.buckets - 1
    );

    if (bucketIndex < 0 || bucketIndex >= seed.length) {
      continue;
    }

    const kind = getActivityKind(item);
    const usdValue = getActivityUsdValue(item);
    const signedValue =
      kind === "received" ? usdValue : kind === "sent" ? usdValue * -1 : 0;

    seed[bucketIndex].netFlowUsd += signedValue;
    seed[bucketIndex].txCount += 1;
  }

  let cumulative = 0;

  return seed.map((item) => {
    cumulative += item.netFlowUsd;

    return {
      ...item,
      cumulativeFlowUsd: Number(cumulative.toFixed(2)),
      netFlowUsd: Number(item.netFlowUsd.toFixed(2))
    };
  });
}

export function buildOverviewMetrics(walletSnapshot, portfolio, activity) {
  const totalValueUsd =
    typeof portfolio?.totalValueUsd === "number" && Number.isFinite(portfolio.totalValueUsd)
      ? portfolio.totalValueUsd
      : null;
  const flow24h = buildFlowSeries(activity, "24h");
  const lastPoint = flow24h[flow24h.length - 1];
  const flow24hUsd = lastPoint?.cumulativeFlowUsd || 0;

  let dailyChangePct = null;

  if (typeof totalValueUsd === "number" && Number.isFinite(totalValueUsd)) {
    const previousBase = totalValueUsd - flow24hUsd;

    if (previousBase > 0) {
      dailyChangePct = (flow24hUsd / previousBase) * 100;
    } else if (flow24hUsd === 0) {
      dailyChangePct = 0;
    }
  }

  return {
    walletLabel: shortAddress(walletSnapshot?.address),
    totalValueLabel:
      typeof totalValueUsd === "number" ? formatUsdValue(totalValueUsd) : "Value syncing",
    dailyChangePct,
    dailyChangeLabel: formatPercentage(dailyChangePct),
    flow24hLabel: formatUsdValue(flow24hUsd),
    networkStatus: walletSnapshot?.onArc ? "Arc Testnet connected" : "Switch to Arc Testnet"
  };
}

export function buildPortfolioInsights(walletSnapshot, portfolio, activity) {
  const assets = Array.isArray(portfolio?.assets) ? portfolio.assets : [];
  const totalComparableValue = assets.reduce(
    (sum, asset) => sum + resolveAssetComparableValue(asset),
    0
  );
  const stableValue = assets
    .filter((asset) => ["USDC", "EURC", "USYC"].includes(String(asset.symbol).toUpperCase()))
    .reduce((sum, asset) => sum + resolveAssetComparableValue(asset), 0);
  const stableRatio = totalComparableValue > 0 ? stableValue / totalComparableValue : null;
  const topAsset = assets[0] || null;
  const approvalCount = (Array.isArray(activity) ? activity : []).filter(
    (item) => getActivityKind(item) === "approval"
  ).length;
  const transactionCount = Array.isArray(activity) ? activity.length : 0;

  let riskLabel = "Low";
  let riskTone = "green";

  if (approvalCount > 1 || (stableRatio !== null && stableRatio < 0.45)) {
    riskLabel = "Moderate";
    riskTone = "amber";
  }

  if (approvalCount > 3 || assets.length <= 1) {
    riskLabel = "Elevated";
    riskTone = "red";
  }

  return {
    summary: walletSnapshot?.isSignedIn
      ? topAsset
        ? `${topAsset.symbol} is the largest visible position in this Arc wallet right now.`
        : "The wallet is connected, but no supported Arc balances are visible yet."
      : "Connect an Arc wallet to generate a live AI wallet summary.",
    spending:
      transactionCount > 0
        ? `${transactionCount} recent wallet events were detected in the latest Arc activity window.`
        : "No recent supported transactions were found in the safe Arc lookback window.",
    diversification:
      assets.length > 1
        ? `${assets.length} supported assets are currently visible across your Arc portfolio.`
        : "This portfolio is concentrated in one visible supported asset.",
    stableAllocation:
      stableRatio !== null
        ? `${Math.round(stableRatio * 100)}% of the tracked portfolio is held in Arc-native or stable assets.`
        : "Stable allocation will appear once balances finish syncing.",
    riskLabel,
    riskTone,
    mostHeldLabel: topAsset
      ? `${topAsset.balanceLabel} ${topAsset.symbol}`
      : "No visible holding",
    approvalCount
  };
}

export function buildSecuritySignals(walletSnapshot, activityStatus, insights) {
  const scoreParts = [
    walletSnapshot?.isSignedIn ? 35 : 0,
    walletSnapshot?.onArc ? 35 : 0,
    activityStatus === "ready" ? 20 : 8,
    insights.approvalCount === 0 ? 10 : insights.approvalCount < 3 ? 6 : 2
  ];
  const score = Math.min(scoreParts.reduce((sum, value) => sum + value, 0), 100);

  return {
    score,
    session: walletSnapshot?.isSignedIn ? "Active wallet session" : "No wallet session",
    network: walletSnapshot?.onArc ? "Arc network verified" : "Network switch required",
    monitoring:
      activityStatus === "ready"
        ? "Transaction monitoring live"
        : "Monitoring is catching up"
  };
}

export function downloadActivityCsv(activity, walletAddress) {
  const rows = Array.isArray(activity) ? activity : [];

  const csvLines = [
    ["wallet", walletAddress || ""].join(","),
    ["type", "token", "amount", "summary", "block", "time", "hash", "status", "link"].join(","),
    ...rows.map((item) =>
      [
        item.type || "",
        item.token || "",
        item.amount || "",
        `"${String(item.summary || "").replaceAll('"', '""')}"`,
        item.blockNumber || "",
        item.timeLabel || "",
        item.txHash || "",
        item.status || "Confirmed",
        item.explorerUrl || ""
      ].join(",")
    )
  ].join("\n");

  const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `arc-wallet-activity-${walletAddress || "wallet"}.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
}
