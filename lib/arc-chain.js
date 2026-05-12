export const ARC_TESTNET_NETWORK_CONFIG = {
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  currencySymbol: "USDC",
  explorerUrl: "https://testnet.arcscan.app"
};

export const arcTestnet = {
  id: ARC_TESTNET_NETWORK_CONFIG.chainId,
  name: "Arc Testnet",
  iconBackground: "#06131d",
  nativeCurrency: {
    name: "USDC",
    symbol: ARC_TESTNET_NETWORK_CONFIG.currencySymbol,
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [ARC_TESTNET_NETWORK_CONFIG.rpcUrl],
      webSocket: ["wss://rpc.testnet.arc.network"]
    },
    public: {
      http: [ARC_TESTNET_NETWORK_CONFIG.rpcUrl],
      webSocket: ["wss://rpc.testnet.arc.network"]
    }
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_TESTNET_NETWORK_CONFIG.explorerUrl
    }
  },
  testnet: true
};

export const ARC_NETWORK_DETAILS = [
  { label: "RPC", value: ARC_TESTNET_NETWORK_CONFIG.rpcUrl },
  { label: "Explorer", value: ARC_TESTNET_NETWORK_CONFIG.explorerUrl },
  { label: "Faucet", value: "https://faucet.circle.com" }
];

export const ARC_TESTNET_INFO_ITEMS = [
  {
    label: "Chain ID",
    value: String(ARC_TESTNET_NETWORK_CONFIG.chainId)
  },
  {
    label: "Gas Token",
    value: ARC_TESTNET_NETWORK_CONFIG.currencySymbol
  },
  {
    label: "RPC",
    value: ARC_TESTNET_NETWORK_CONFIG.rpcUrl,
    href: ARC_TESTNET_NETWORK_CONFIG.rpcUrl
  },
  {
    label: "Explorer",
    value: ARC_TESTNET_NETWORK_CONFIG.explorerUrl,
    href: ARC_TESTNET_NETWORK_CONFIG.explorerUrl
  },
  {
    label: "Faucet",
    value: "https://faucet.circle.com",
    href: "https://faucet.circle.com"
  }
];

export const ARC_USDC_ERC20_ADDRESS =
  "0x3600000000000000000000000000000000000000";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const hasWalletConnectProjectId =
  walletConnectProjectId !== "YOUR_PROJECT_ID";
