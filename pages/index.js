import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import AppShell from "../components/app-shell";
import SendUsdcPanel from "../components/send-usdc-panel";
import TransactionActivity from "../components/transaction-activity";
import WalletAiDrawer from "../components/wallet-ai-drawer";
import WalletLoginScreen from "../components/wallet-login-screen";
import WalletSidebar from "../components/wallet-sidebar";
import ReceiveModal from "../components/wallet/ReceiveModal";
import WalletConnect from "../components/wallet-connect";
import { arcTestnet } from "../lib/arc-chain";
import { useWalletAppState } from "../lib/use-wallet-app-state";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arc-ai-wallet.vercel.app";
const SUPPORTED_VIEWS = new Set(["send", "activity"]);

function WelcomeOverlay() {
  return (
    <div className="welcome-overlay" role="status" aria-live="polite">
      <span>Welcome to</span>
      <strong>AI Powered Wallet Built on Arc</strong>
    </div>
  );
}

export default function Home() {
  const {
    walletSnapshot,
    mergedActivity,
    liveActivityStatus,
    liveActivityError,
    saveLocalActivity
  } = useWalletAppState();
  const [activeView, setActiveView] = useState("send");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomedAddressRef = useRef("");

  useEffect(() => {
    const syncViewFromHash = () => {
      const nextHash = String(window.location.hash || "").replace(/^#/, "");

      if (SUPPORTED_VIEWS.has(nextHash)) {
        setActiveView(nextHash);
      }
    };

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);

    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  useEffect(() => {
    if (
      walletSnapshot.isSignedIn &&
      walletSnapshot.address &&
      welcomedAddressRef.current !== walletSnapshot.address
    ) {
      welcomedAddressRef.current = walletSnapshot.address;
      setShowWelcome(true);
      const timeoutId = window.setTimeout(() => setShowWelcome(false), 1500);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [walletSnapshot.address, walletSnapshot.isSignedIn]);

  const handleSelectView = (view) => {
    setActiveView(view);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/#${view}`);
    }
  };

  if (!walletSnapshot.isSignedIn) {
    return (
      <>
        <Head>
          <title>Arc AI Wallet | Built on Arc</title>
          <meta
            name="description"
            content="Send, bridge, and manage USDC on Arc with AI."
          />
          <meta name="theme-color" content="#070b14" />
          <link rel="canonical" href={SITE_URL} />
        </Head>
        <WalletLoginScreen />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Arc AI Wallet | Built on Arc</title>
        <meta
          name="description"
          content="Send, receive, and understand USDC wallet activity on Arc with AI."
        />
        <meta name="theme-color" content="#070b14" />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <AppShell>
        {showWelcome ? <WelcomeOverlay /> : null}

        <section className="wallet-dashboard-hero card">
          <div>
            <p className="section-kicker">Arc AI Wallet</p>
            <h1>Welcome back</h1>
            <p>
              A focused USDC wallet for Arc: send, receive, review activity, and
              ask the copilot when a blockchain action needs plain language.
            </p>
          </div>
          <div className="hero-meta">
            <span>{arcTestnet.name}</span>
            <span>USDC gas</span>
          </div>
        </section>

        <WalletConnect
          walletSnapshot={walletSnapshot}
          onReceiveClick={() => setReceiveOpen(true)}
        />

        <section className="dashboard-problem-solution card">
          <article>
            <span className="field-label">Problem</span>
            <strong>
              Crypto wallets are still complex for normal users. Sending,
              receiving, checking balance, and understanding wallet activity feels
              confusing.
            </strong>
          </article>
          <article>
            <span className="field-label">Solution</span>
            <strong>
              This AI Powered Wallet built on Arc makes wallet actions simple with
              wallet connection, USDC balance, receive QR, send flow, transaction
              activity, and AI guidance in one clean interface.
            </strong>
          </article>
        </section>

        <div className="wallet-workspace">
          <WalletSidebar
            activeView={activeView}
            onSelect={handleSelectView}
            onReceive={() => setReceiveOpen(true)}
          />

          <div className="wallet-main-panel">
            {activeView === "activity" ? (
              <TransactionActivity
                walletSnapshot={walletSnapshot}
                items={mergedActivity}
                liveStatus={liveActivityStatus}
                liveError={liveActivityError}
              />
            ) : (
              <SendUsdcPanel
                walletSnapshot={walletSnapshot}
                onActivitySaved={saveLocalActivity}
              />
            )}
          </div>
        </div>

        <ReceiveModal
          open={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          address={walletSnapshot.address}
          networkLabel={arcTestnet.name}
        />

        <WalletAiDrawer
          open={assistantOpen}
          onOpen={() => setAssistantOpen(true)}
          onClose={() => setAssistantOpen(false)}
          walletSnapshot={walletSnapshot}
          activityItems={mergedActivity}
          activityStatus={liveActivityStatus}
        />
      </AppShell>
    </>
  );
}
