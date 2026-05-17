import Head from "next/head";
import AppShell from "../components/app-shell";
import BridgeToArcPanel from "../components/bridge-to-arc-panel";
import { useWalletAppState } from "../lib/use-wallet-app-state";

export default function BridgePage() {
  const { walletSnapshot, saveLocalActivity } = useWalletAppState();

  return (
    <>
      <Head>
        <title>Bridge USDC | Arc AI Wallet</title>
      </Head>
      <AppShell>
        <section className="hero-card">
          <p className="section-kicker">Bridge USDC</p>
          <h1>Bridge USDC into Arc</h1>
          <p className="hero-subtitle">
            Use Arc App Kit Bridge to move supported testnet USDC from another
            chain into Arc Testnet.
          </p>
        </section>
        <BridgeToArcPanel
          walletSnapshot={walletSnapshot}
          onActivitySaved={saveLocalActivity}
        />
      </AppShell>
    </>
  );
}
