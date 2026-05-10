export const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  iconBackground: "#06131d",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"]
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"]
    }
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app"
    }
  },
  testnet: true
};

export const ARC_NETWORK_DETAILS = [
  { label: "RPC", value: "https://rpc.testnet.arc.network" },
  { label: "Explorer", value: "https://testnet.arcscan.app" },
  { label: "Faucet", value: "https://faucet.circle.com" }
];

export const ARC_USDC_ERC20_ADDRESS =
  "0x3600000000000000000000000000000000000000";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const hasWalletConnectProjectId =
  walletConnectProjectId !== "YOUR_PROJECT_ID";
