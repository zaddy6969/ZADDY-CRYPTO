import Head from "next/head";
import AppShell from "../components/app-shell";
import TransactionActivity from "../components/transaction-activity";
import { useWalletAppState } from "../lib/use-wallet-app-state";

export default function ActivityPage() {
  const {
    walletSnapshot,
    mergedActivity,
    liveActivityStatus,
    liveActivityError
  } = useWalletAppState();

  return (
    <>
      <Head>
        <title>Activity | Arc AI Wallet</title>
      </Head>
      <AppShell>
        <section className="hero-card">
          <p className="section-kicker">Activity</p>
          <h1>Track wallet actions clearly</h1>
          <p className="hero-subtitle">
            See App Kit actions you triggered in this wallet together with recent
            Arc onchain activity and explorer links.
          </p>
        </section>
        <TransactionActivity
          walletSnapshot={walletSnapshot}
          items={mergedActivity}
          liveStatus={liveActivityStatus}
          liveError={liveActivityError}
        />
      </AppShell>
    </>
  );
}
