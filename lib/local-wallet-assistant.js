function normalizePrompt(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAssets(context) {
  return Array.isArray(context?.portfolio?.assets) ? context.portfolio.assets : [];
}

function getLatestActivity(context) {
  const items = Array.isArray(context?.activity?.items) ? context.activity.items : [];
  return items[0] || null;
}

function summarizeWallet(context) {
  const wallet = context?.wallet || {};

  if (!wallet.connected) {
    return "No wallet is connected right now. Connect a wallet first to unlock live Arc wallet guidance.";
  }

  const lines = [
    `Wallet connected at ${wallet.address}.`,
    wallet.onArc
      ? "The wallet is on Arc Testnet."
      : "The wallet is connected but not on Arc Testnet yet."
  ];

  if (wallet.usdcBalance && wallet.balanceStatus === "ready") {
    lines.push(`Visible Arc USDC balance: ${wallet.usdcBalance}.`);
  }

  return lines.join(" ");
}

function summarizePortfolio(context) {
  const portfolio = context?.portfolio || {};
  const assets = getAssets(context);

  if (portfolio.status === "loading" || portfolio.status === "refreshing") {
    return "Portfolio balances are still loading.";
  }

  if (portfolio.status === "error") {
    return "Portfolio data is temporarily unavailable.";
  }

  if (!assets.length) {
    return "No supported Arc portfolio assets were detected in the latest balance check.";
  }

  const topAsset = [...assets].sort((left, right) => {
    const leftScore = typeof left.valueUsd === "number" ? left.valueUsd : left.balance;
    const rightScore = typeof right.valueUsd === "number" ? right.valueUsd : right.balance;
    return rightScore - leftScore;
  })[0];

  const stableShare = assets
    .filter((asset) => ["USDC", "EURC", "USYC"].includes(asset.symbol))
    .reduce((sum, asset) => sum + (asset.allocation || 0), 0);

  const riskLevel =
    stableShare >= 70 ? "Low" : stableShare >= 40 ? "Moderate" : "Elevated";

  return [
    `Most held asset: ${topAsset.symbol}.`,
    `Portfolio risk level: ${riskLevel}.`,
    stableShare >= 50
      ? "Stablecoin allocation is high."
      : "Stablecoin allocation is balanced rather than dominant."
  ].join(" ");
}

function summarizeLatestTransaction(context) {
  const status = context?.activity?.status;
  const latest = getLatestActivity(context);

  if (status === "loading" || status === "refreshing") {
    return "Recent Arc activity is still loading.";
  }

  if (status === "error") {
    return "Activity temporarily unavailable. Please try again later.";
  }

  if (!latest) {
    return "No recent Arc wallet activity was found in the latest safe lookback window.";
  }

  return `Latest transaction: ${latest.type} for ${latest.amount || "an unknown amount"} on ${latest.token || "a tracked contract"}, ${latest.timeLabel}, transaction ${latest.txHashShort}.`;
}

function buildSummaryResponse(context) {
  return [
    summarizeWallet(context),
    summarizePortfolio(context),
    summarizeLatestTransaction(context)
  ].join(" ");
}

function buildRiskResponse(context) {
  return [summarizePortfolio(context), summarizeLatestTransaction(context)].join(" ");
}

function buildLatestResponse(context) {
  return [summarizeWallet(context), summarizeLatestTransaction(context)].join(" ");
}

export function generateLocalAssistantAnswer({ question, context }) {
  const prompt = normalizePrompt(question);

  if (
    prompt.includes("latest") ||
    prompt.includes("transaction") ||
    prompt.includes("activity") ||
    prompt.includes("explain")
  ) {
    return buildLatestResponse(context);
  }

  if (
    prompt.includes("risk") ||
    prompt.includes("allocation") ||
    prompt.includes("portfolio") ||
    prompt.includes("insight")
  ) {
    return buildRiskResponse(context);
  }

  return buildSummaryResponse(context);
}
