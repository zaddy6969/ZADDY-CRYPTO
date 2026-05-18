import { formatUnits } from "viem";
import {
  APP_KIT_EVM_CHAIN_OPTIONS,
  arcTestnet
} from "./arc-chain";

const CHAIN_NAME_BY_APP_KIT_ID = new Map(
  APP_KIT_EVM_CHAIN_OPTIONS.map((option) => [option.appKitChain, option.name])
);

function getChainLookup(chainModule) {
  const moduleKeyByAppKitId = {
    Arc_Testnet: "ArcTestnet",
    Ethereum_Sepolia: "EthereumSepolia",
    Base_Sepolia: "BaseSepolia"
  };

  return APP_KIT_EVM_CHAIN_OPTIONS.reduce((lookup, option) => {
    lookup[option.appKitChain] =
      chainModule[moduleKeyByAppKitId[option.appKitChain] || option.appKitChain];
    return lookup;
  }, {});
}

export async function createArcAppKitClient(provider) {
  const [{ AppKit }, { createViemAdapterFromProvider }, chainModule] =
    await Promise.all([
      import("@circle-fin/app-kit"),
      import("@circle-fin/adapter-viem-v2"),
      import("@circle-fin/app-kit/chains")
    ]);

  const chainLookup = getChainLookup(chainModule);
  const supportedChains = Object.values(chainLookup);
  const adapter = await createViemAdapterFromProvider({
    provider,
    capabilities: {
      addressContext: "user-controlled",
      supportedChains
    }
  });

  return {
    adapter,
    chainLookup,
    kit: new AppKit()
  };
}

export function formatAppKitError(error, fallbackMessage) {
  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage || "Something went wrong while using Arc App Kit.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request")
  ) {
    return "The wallet request was canceled before it was submitted.";
  }

  if (normalized.includes("connector not connected")) {
    return "Connect your wallet before trying this action.";
  }

  if (normalized.includes("insufficient")) {
    return "The wallet does not have enough balance to complete this action.";
  }

  if (
    normalized.includes("switchchain") ||
    normalized.includes("chain mismatch") ||
    normalized.includes("wrong network")
  ) {
    return "Switch to the required network, then try again.";
  }

  return message || fallbackMessage || "Something went wrong while using Arc App Kit.";
}

export function formatEstimatedGas(estimate) {
  if (!estimate || typeof estimate.fee !== "string") {
    return "";
  }

  try {
    return `${Number(formatUnits(BigInt(estimate.fee), 18)).toFixed(6)} ${arcTestnet.nativeCurrency.symbol}`;
  } catch {
    return `${estimate.fee} base units`;
  }
}

export function normalizeActionSteps(result) {
  if (!result || !Array.isArray(result.steps)) {
    return [];
  }

  return result.steps.map((step, index) => ({
    id: `${step.name || "step"}-${index}`,
    name: step.name || `Step ${index + 1}`,
    state: step.state || "pending",
    txHash: step.txHash || "",
    explorerUrl: step.explorerUrl || ""
  }));
}

export function getPrimaryTxHash(result) {
  if (result?.txHash) {
    return result.txHash;
  }

  const firstStep = normalizeActionSteps(result).find((step) => step.txHash);
  return firstStep?.txHash || "";
}

export function getPrimaryExplorerUrl(result) {
  if (result?.explorerUrl) {
    return result.explorerUrl;
  }

  const firstStep = normalizeActionSteps(result).find((step) => step.explorerUrl);
  return firstStep?.explorerUrl || "";
}

export function getChainLabel(appKitChain) {
  return CHAIN_NAME_BY_APP_KIT_ID.get(appKitChain) || appKitChain || "Unknown chain";
}

export function formatUnifiedBalanceBreakdown(balances) {
  if (!balances || !Array.isArray(balances.breakdown)) {
    return [];
  }

  return balances.breakdown.flatMap((accountEntry) =>
    (accountEntry.breakdown || []).map((chainEntry) => ({
      account: accountEntry.depositor,
      chain: getChainLabel(chainEntry.chain),
      appKitChain: chainEntry.chain,
      confirmedBalance: chainEntry.confirmedBalance || "0.00",
      pendingBalance: chainEntry.pendingBalance || "0.00",
      pendingTransactions: Array.isArray(chainEntry.pendingTransactions)
        ? chainEntry.pendingTransactions
        : []
    }))
  );
}
