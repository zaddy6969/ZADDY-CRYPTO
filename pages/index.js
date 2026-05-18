import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/app-shell";
import BridgeToArcPanel from "../components/bridge-to-arc-panel";
import SendUsdcPanel from "../components/send-usdc-panel";
import TransactionActivity from "../components/transaction-activity";
import UnifiedBalancePanel from "../components/unified-balance-panel";
import ReceiveModal from "../components/wallet/ReceiveModal";
import WalletAssistant from "../components/wallet-assistant";
import WalletConnect, { WalletConnectCta } from "../components/wallet-connect";
import { arcTestnet } from "../lib/arc-chain";
import { useUnifiedBalanceSummary } from "../lib/use-unified-balance-summary";
import { useWalletAppState } from "../lib/use-wallet-app-state";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arc-ai-wallet.vercel.app";

const DASHBOARD_TABS = [
  {
    id: "send",
    label: "Send",
    kicker: "App Kit Send",
    body: "Transfer USDC on Arc Testnet with your connected wallet."
  },
  {
    id: "bridge",
    label: "Bridge",
    kicker: "App Kit Bridge",
    body: "Move supported testnet USDC into Arc Testnet."
  },
  {
    id: "unified-balance",
    label: "Unified Balance",
    kicker: "Crosschain USDC",
    body: "Deposit from supported chains and spend instantly on Arc."
  },
  {
    id: "assistant",
    label: "AI Assistant",
    kicker: "Wallet Copilot",
    body: "Ask real questions about Arc, USDC gas, activity, and next steps."
  },
  {
    id: "activity",
    label: "Activity",
    kicker: "Wallet History",
    body: "Track Send, Bridge, Deposit, and Spend actions with explorer links."
  }
];

function getTabFromHash() {
  if (typeof window === "undefined") {
    return "send";
  }

  const hash = String(window.location.hash || "").replace(/^#/, "");
  return DASHBOARD_TABS.some((tab) => tab.id === hash) ? hash : "send";
}

export default function Home() {
  const {
    walletSnapshot,
    mergedActivity,
    liveActivityStatus,
    liveActivityError,
    saveLocalActivity
  } = useWalletAppState();
  const {
    summary: unifiedBalance,
    status: unifiedBalanceStatus
  } = useUnifiedBalanceSummary(walletSnapshot.isSignedIn);
  const [activeTab, setActiveTab] = useState("send");
  const [receiveOpen, setReceiveOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      setActiveTab(getTabFromHash());
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  const activeTabMeta = useMemo(
    () => DASHBOARD_TABS.find((tab) => tab.id === activeTab) || DASHBOARD_TABS[0],
    [activeTab]
  );

  const setDashboardTab = (tabId) => {
    setActiveTab(tabId);

    if (typeof window !== "undefined") {
      const nextUrl = `${window.location.pathname}#${tabId}`;
      window.history.replaceState(null, "", nextUrl);
    }
  };

  const renderActivePanel = () => {
    if (activeTab === "bridge") {
      return (
        <BridgeToArcPanel
          sectionId="dashboard-bridge"
          walletSnapshot={walletSnapshot}
          onActivitySaved={saveLocalActivity}
        />
      );
    }

    if (activeTab === "unified-balance") {
      return (
        <UnifiedBalancePanel
          walletSnapshot={walletSnapshot}
          onActivitySaved={saveLocalActivity}
        />
      );
    }

    if (activeTab === "assistant") {
      return (
        <WalletAssistant
          walletSnapshot={walletSnapshot}
          activityItems={mergedActivity}
          activityStatus={liveActivityStatus}
          unifiedBalance={unifiedBalance}
        />
      );
    }

    if (activeTab === "activity") {
      return (
        <TransactionActivity
          walletSnapshot={walletSnapshot}
          items={mergedActivity}
          liveStatus={liveActivityStatus}
          liveError={liveActivityError}
        />
      );
    }

    return (
      <SendUsdcPanel
        walletSnapshot={walletSnapshot}
        onActivitySaved={saveLocalActivity}
      />
    );
  };

  return (
    <>
      <Head>
        <title>Arc AI Wallet | Built on Arc</title>
        <meta
          name="description"
          content="Simple AI-powered wallet dashboard for Arc Testnet."
        />
        <meta name="theme-color" content="#070b14" />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <AppShell>
        <section className="hero-card">
          <p className="section-kicker">Dashboard</p>
          <h1>Arc AI Wallet</h1>
          <p className="hero-subtitle">
            A simple, working wallet app for Arc Testnet powered by Arc App Kit.
          </p>
          <div className="hero-meta">
            <span>{arcTestnet.name}</span>
            <span>Chain ID {arcTestnet.id}</span>
            <span>USDC gas</span>
          </div>
          <div className="hero-actions">
            <WalletConnectCta className="hero-actions-inline" />
            {walletSnapshot.isSignedIn ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setReceiveOpen(true)}
              >
                Receive
              </button>
            ) : null}
          </div>
          <div className="wallet-summary-grid">
            <div className="wallet-summary-item">
              <span className="field-label">Connected wallet</span>
              <strong>{walletSnapshot.address || "No wallet connected"}</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Arc status</span>
              <strong>
                {walletSnapshot.isSignedIn
                  ? walletSnapshot.onArc
                    ? "Arc Testnet ready"
                    : "Wrong network"
                  : "Connect wallet"}
              </strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">USDC balance</span>
              <strong>{walletSnapshot.usdcBalance || "Syncing..."}</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Unified Balance</span>
              <strong>
                {unifiedBalance?.totalConfirmedBalance || "0.00"} USDC
              </strong>
              <small>
                {unifiedBalanceStatus === "loading"
                  ? "Loading your combined crosschain USDC"
                  : "Confirmed spendable USDC tracked by App Kit"}
              </small>
            </div>
          </div>
        </section>

        <WalletConnect
          walletSnapshot={walletSnapshot}
          onReceiveClick={() => setReceiveOpen(true)}
        />

        <section className="card" id="dashboard-actions">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Wallet Actions</p>
              <h2>Everything in one dashboard</h2>
            </div>
            <span className="status-badge">{activeTabMeta.kicker}</span>
          </div>

          <div className="dashboard-tab-row" role="tablist" aria-label="Dashboard actions">
            {DASHBOARD_TABS.map((tab) => {
              const isActive = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  className={`dashboard-tab ${isActive ? "dashboard-tab-active" : ""}`}
                  onClick={() => setDashboardTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="empty-state empty-state-compact">
            <strong>{activeTabMeta.label}</strong>
            <p>{activeTabMeta.body}</p>
          </div>

          <div
            id={`panel-${activeTabMeta.id}`}
            role="tabpanel"
            className="dashboard-tab-panel"
          >
            {renderActivePanel()}
          </div>
        </section>

        <ReceiveModal
          open={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          address={walletSnapshot.address}
          networkLabel={arcTestnet.name}
        />
      </AppShell>
    </>
  );
}
