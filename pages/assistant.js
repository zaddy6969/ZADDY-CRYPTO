import Head from "next/head";
import AppShell from "../components/app-shell";
import WalletAssistant from "../components/wallet-assistant";
import { useUnifiedBalanceSummary } from "../lib/use-unified-balance-summary";
import { useWalletAppState } from "../lib/use-wallet-app-state";

export default function AssistantPage() {
  const {
    walletSnapshot,
    mergedActivity,
    liveActivityStatus
  } = useWalletAppState();
  const { summary: unifiedBalance } = useUnifiedBalanceSummary(
    walletSnapshot.isSignedIn
  );

  return (
    <>
      <Head>
        <title>AI Assistant | Arc AI Wallet</title>
      </Head>
      <AppShell>
        <section className="hero-card">
          <p className="section-kicker">AI Assistant</p>
          <h1>Ask Wallet Copilot</h1>
          <p className="hero-subtitle">
            Get short, useful answers about your Arc wallet, recent activity,
            Send, Bridge, Unified Balance, and USDC gas.
          </p>
        </section>
        <WalletAssistant
          walletSnapshot={walletSnapshot}
          activityItems={mergedActivity}
          activityStatus={liveActivityStatus}
          unifiedBalance={unifiedBalance}
        />
      </AppShell>
    </>
  );
}
