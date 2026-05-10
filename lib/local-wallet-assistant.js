function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function summarizeWallet(wallet) {
  if (!wallet?.connected) {
    return "No wallet is connected right now, so the dashboard can only comment on the visible market and activity panels.";
  }

  const parts = [];

  parts.push(`Your wallet is connected${wallet.address ? ` at ${wallet.address}` : ""}.`);

  if (wallet.onArc) {
    parts.push("It is currently on Arc Testnet.");
  } else {
    parts.push("It is not currently on Arc Testnet, so Arc-specific actions may not be ready.");
  }

  if (wallet.usdcBalance && !["idle", "loading", "error"].includes(wallet.usdcBalance)) {
    parts.push(`The current Arc USDC balance shown in the dashboard is ${wallet.usdcBalance}.`);
  }

  return parts.join(" ");
}

function summarizeActivity(activity) {
  if (!Array.isArray(activity) || activity.length === 0) {
    return "The dashboard does not currently list any recent wallet activity.";
  }

  const recent = activity.slice(0, 3);
  const lines = recent.map(
    (item) => `${item.title} (${item.meta})${item.value ? `, ${item.value}` : ""}`
  );

  return `Recent activity on the dashboard includes ${lines.join("; ")}.`;
}

function summarizeStats(statCards) {
  if (!Array.isArray(statCards) || statCards.length === 0) {
    return "There are no portfolio summary cards available in the current view.";
  }

  const visible = statCards
    .slice(0, 3)
    .map((card) => `${card.label}: ${card.value}${card.change ? ` (${card.change})` : ""}`);

  return `The top dashboard metrics are ${visible.join("; ")}.`;
}

export function generateLocalAssistantAnswer({ question, wallet, dashboard }) {
  const prompt = normalizeText(question).toLowerCase();
  const walletSummary = summarizeWallet(wallet || {});
  const activitySummary = summarizeActivity(dashboard?.activity || []);
  const statsSummary = summarizeStats(dashboard?.statCards || []);

  if (
    prompt.includes("new user") ||
    prompt.includes("what is this") ||
    prompt.includes("explain")
  ) {
    return [
      "arc-ai-wallet is a monitoring dashboard for an Arc wallet.",
      walletSummary,
      "The wallet module handles connection and Arc USDC balance, the analyzer explains transactions in plain English, and the assistant uses the visible dashboard context to answer questions."
    ].join(" ");
  }

  if (
    prompt.includes("recent activity") ||
    prompt.includes("activity") ||
    prompt.includes("what happened")
  ) {
    return [walletSummary, activitySummary].join(" ");
  }

  if (
    prompt.includes("watch") ||
    prompt.includes("risk") ||
    prompt.includes("should i") ||
    prompt.includes("monitor")
  ) {
    const watchItems = [];

    if (!wallet?.connected) {
      watchItems.push("connect the wallet first so the dashboard can read its Arc state");
    }

    if (wallet?.connected && !wallet?.onArc) {
      watchItems.push("switch to Arc Testnet before expecting Arc-specific wallet actions to work");
    }

    if (wallet?.usdcBalance === "error" || wallet?.usdcBalance === "loading") {
      watchItems.push("confirm the Arc USDC balance has loaded before using it for decisions");
    }

    watchItems.push("review the latest activity feed for escrow funding, approvals, or treasury movement");

    return `${walletSummary} The main things to watch are ${watchItems.join(", ")}.`;
  }

  return [walletSummary, statsSummary, activitySummary].join(" ");
}
