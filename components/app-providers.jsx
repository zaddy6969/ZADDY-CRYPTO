import {
  connectorsForWallets,
  darkTheme,
  RainbowKitProvider
} from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  safeWallet,
  walletConnectWallet
} from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import {
  MULTICHAIN_WALLET_CHAINS,
  arcTestnet,
  hasWalletConnectProjectId,
  walletConnectProjectId
} from "../lib/arc-chain";

const wallets = [
  injectedWallet,
  safeWallet
];

if (hasWalletConnectProjectId) {
  wallets.push(walletConnectWallet);
}

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets
    }
  ],
  {
    appName: "arc-ai-wallet",
    ...(hasWalletConnectProjectId
      ? { projectId: walletConnectProjectId }
      : {})
  }
);

const config = createConfig({
  connectors,
  chains: MULTICHAIN_WALLET_CHAINS,
  ssr: true,
  transports: Object.fromEntries(
    MULTICHAIN_WALLET_CHAINS.map((chain) => [
      chain.id,
      http(chain.rpcUrls.default.http[0])
    ])
  )
});

const rainbowTheme = darkTheme({
  accentColor: "#61d8ff",
  accentColorForeground: "#06131d",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small"
});

export default function AppProviders({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={arcTestnet} theme={rainbowTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
