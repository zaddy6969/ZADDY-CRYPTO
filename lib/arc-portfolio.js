import { ARC_USDC_ERC20_ADDRESS } from "./arc-chain";

export const ARC_PORTFOLIO_ASSETS = [
  {
    key: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    address: ARC_USDC_ERC20_ADDRESS,
    decimals: 6,
    tokenType: "Native Arc gas asset",
    accent: "blue",
    priceUsd: 1
  },
  {
    key: "eurc",
    name: "Euro Coin",
    symbol: "EURC",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    tokenType: "Arc ecosystem stablecoin",
    accent: "violet",
    priceUsd: null
  },
  {
    key: "usyc",
    name: "USYC",
    symbol: "USYC",
    address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    decimals: 6,
    tokenType: "Arc ecosystem treasury asset",
    accent: "cyan",
    priceUsd: null
  }
];

export function formatTokenBalance(value) {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: numeric >= 1000 ? 0 : 2,
    maximumFractionDigits: 4
  }).format(numeric);
}

export function formatUsdValue(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Value unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

export function shortAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
