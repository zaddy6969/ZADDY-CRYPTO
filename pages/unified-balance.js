import Head from "next/head";
import AppShell from "../components/app-shell";
import UnifiedBalancePanel from "../components/unified-balance-panel";
import { useWalletAppState } from "../lib/use-wallet-app-state";

export default function UnifiedBalancePage() {
  const { walletSnapshot, saveLocalActivity } = useWalletAppState();

  return (
    <>
      <Head>
        <title>Unified Balance | Arc AI Wallet</title>
      </Head>
      <AppShell>
        <section className="hero-card">
          <p className="section-kicker">Unified Balance</p>
          <h1>One spendable USDC balance across chains</h1>
          <p className="hero-subtitle">
            Deposit USDC from supported chains, check confirmed and pending
            totals, then spend that balance directly onto Arc Testnet.
          </p>
        </section>
        <UnifiedBalancePanel
          walletSnapshot={walletSnapshot}
          onActivitySaved={saveLocalActivity}
        />
      </AppShell>
    </>
  );
}
