import Head from "next/head";
import AppShell from "../components/app-shell";
import SendUsdcPanel from "../components/send-usdc-panel";
import { useWalletAppState } from "../lib/use-wallet-app-state";

export default function SendPage() {
  const { walletSnapshot, saveLocalActivity } = useWalletAppState();

  return (
    <>
      <Head>
        <title>Send USDC | Arc AI Wallet</title>
      </Head>
      <AppShell>
        <section className="hero-card">
          <p className="section-kicker">Send USDC</p>
          <h1>Send USDC on Arc Testnet</h1>
          <p className="hero-subtitle">
            This flow uses Arc App Kit Send with your connected wallet and saves
            the resulting transfer into local activity history.
          </p>
        </section>
        <SendUsdcPanel
          walletSnapshot={walletSnapshot}
          onActivitySaved={saveLocalActivity}
        />
      </AppShell>
    </>
  );
}
