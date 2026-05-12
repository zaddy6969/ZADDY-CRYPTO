function normalizePrompt(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function summarizeWallet(context) {
  const wallet = context?.wallet || {};

  if (!wallet.connected) {
    return "No wallet is connected right now. Connect a wallet first to unlock real portfolio and transaction analysis.";
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
  const assets = Array.isArray(portfolio.assets) ? portfolio.assets : [];

  if (portfolio.status === "loading" || portfolio.status === "refreshing") {
    return "Portfolio balances are still loading.";
  }

  if (portfolio.status === "error") {
    return "Portfolio data is temporarily unavailable.";
  }

  if (assets.length === 0) {
    return "No supported Arc portfolio assets were detected in the latest balance check.";
  }

  const topAsset = [...assets].sort((left, right) => right.balance - left.balance)[0];
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
      : "The portfolio is not dominated by stable allocations."
  ].join(" ");
}

function summarizeLatestTransaction(context) {
  const items = context?.activity?.items || [];
  const status = context?.activity?.status;

  if (status === "loading" || status === "refreshing") {
    return "Recent Arc activity is still loading.";
  }

  if (status === "error") {
    return "Activity temporarily unavailable. Please try again later.";
  }

  if (!items.length) {
    return "No recent Arc wallet activity was found in the latest safe lookback window.";
  }

  const latest = items[0];

  return `Latest transaction: ${latest.type} for ${latest.amount || "an unknown amount"} on ${latest.token || "a tracked contract"}, ${latest.timeLabel}, transaction ${latest.txHashShort}.`;
}

export function generateLocalAssistantAnswer({ question, context }) {
  const prompt = normalizePrompt(question);
  const walletSummary = summarizeWallet(context);
  const portfolioSummary = summarizePortfolio(context);
  const latestTransaction = summarizeLatestTransaction(context);

  if (
    prompt.includes("latest transaction") ||
    prompt.includes("latest activity") ||
    prompt.includes("explain")
  ) {
    return [walletSummary, latestTransaction].join(" ");
  }

  if (
    prompt.includes("risk") ||
    prompt.includes("portfolio") ||
    prompt.includes("insight")
  ) {
    return [walletSummary, portfolioSummary].join(" ");
  }

  if (
    prompt.includes("summarize") ||
    prompt.includes("summary") ||
    prompt.includes("wallet")
  ) {
    return [walletSummary, portfolioSummary, latestTransaction].join(" ");
  }

  return [walletSummary, portfolioSummary, latestTransaction].join(" ");
}
