import Head from "next/head";
import {
  ARC_TESTNET_INFO_ITEMS,
  arcTestnet
} from "../lib/arc-chain";
import { useArcWalletActivity } from "../lib/use-arc-wallet-activity";
import { useArcWalletSnapshot } from "../lib/use-arc-wallet-snapshot";
import WalletAssistant from "../components/wallet-assistant";
import WalletConnect, {
  WalletConnectCta
} from "../components/wallet-connect";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arc-ai-wallet.vercel.app";

const GITHUB_URL = "https://github.com/zaddy6969/ZADDY-CRYPTO";
const ARC_DOCS_URL = "https://docs.arc.network/";

const navItems = [
  { label: "Overview", id: "section-overview" },
  { label: "Wallet", id: "section-wallet" },
  { label: "Readiness", id: "section-readiness" },
  { label: "Arc Info", id: "section-arc" },
  { label: "Activity", id: "section-activity" },
  { label: "Assistant", id: "section-assistant" }
];

const chainMetrics = [
  { label: "Network", value: arcTestnet.name },
  { label: "Chain ID", value: String(arcTestnet.id) },
  { label: "Gas Asset", value: arcTestnet.nativeCurrency.symbol },
  { label: "RPC", value: arcTestnet.rpcUrls.default.http[0] }
];

function buildOverviewCards(walletSnapshot, activity, activityStatus) {
  const {
    isConnected,
    onArc,
    usdcBalance,
    balanceStatus
  } = walletSnapshot || {};

  const activityCount = Array.isArray(activity) ? activity.length : 0;

  return [
    {
      label: "Wallet Status",
      value: isConnected ? "Connected" : "Connect to begin",
      change: isConnected ? "Live wallet context unlocked" : "Placeholder state",
      tone: isConnected ? "positive" : "neutral",
      placeholder: !isConnected
    },
    {
      label: "Network",
      value: !isConnected
        ? "Waiting for wallet"
        : onArc
          ? "Arc Testnet"
          : "Switch required",
      change: !isConnected
        ? "Arc-ready once connected"
        : onArc
          ? "Correct chain detected"
          : "Move to Arc Testnet",
      tone: !isConnected ? "neutral" : onArc ? "positive" : "warning",
      placeholder: !isConnected
    },
    {
      label: "Arc USDC",
      value: !isConnected
        ? "--"
        : balanceStatus === "loading"
          ? "Loading..."
          : balanceStatus === "error"
            ? "Unavailable"
            : usdcBalance || "0.00 USDC",
      change: !isConnected
        ? "Balance appears after connection"
        : "Arc gas uses native USDC",
      tone:
        !isConnected || balanceStatus === "loading"
          ? "neutral"
          : balanceStatus === "error"
            ? "warning"
            : "positive",
      placeholder: !isConnected
    },
    {
      label: "Activity Feed",
      value: !isConnected
        ? "--"
        : activityStatus === "loading" || activityStatus === "refreshing"
          ? "Syncing..."
          : activityStatus === "error"
            ? "Unavailable"
            : activityCount > 0
              ? `${activityCount} recent events`
              : "No recent events",
      change: !isConnected
        ? "Connect to load onchain history"
        : activityStatus === "error"
          ? "RPC activity fetch failed"
          : "Grounded in live Arc activity",
      tone:
        !isConnected || activityStatus === "loading" || activityStatus === "refreshing"
          ? "neutral"
          : activityStatus === "error"
            ? "warning"
            : "positive",
      placeholder: !isConnected
    }
  ];
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-card">
        <div className="brand-mark">A</div>
        <div>
          <p className="eyebrow">Arc AI Wallet</p>
          <h1>arc-ai-wallet</h1>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {navItems.map((item, index) => (
          <a
            key={item.label}
            href={`#${item.id}`}
            className={index === 0 ? "nav-item active" : "nav-item"}
          >
            <span className="nav-dot" />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        <p className="eyebrow">Launch Ready</p>
        <strong>Built for public Arc demos</strong>
        <span>
          Honest pre-connect placeholders, live Arc wallet context, and a
          polished assistant flow for public sharing.
        </span>
      </div>
    </aside>
  );
}

function SummaryCard({ card }) {
  return (
    <article
      className={
        card.placeholder ? "panel stat-card stat-card-placeholder" : "panel stat-card"
      }
    >
      <div className="stat-copy">
        <span className="eyebrow">{card.label}</span>
        <strong>{card.value}</strong>
        <span className={`delta ${card.tone}`}>{card.change}</span>
      </div>
      <div className="stat-rail" aria-hidden="true">
        <span className={`stat-rail-fill ${card.tone}`} />
      </div>
    </article>
  );
}

function WalletReadiness({ walletSnapshot }) {
  const { address, isConnected, onArc, usdcBalance, balanceStatus } =
    walletSnapshot || {};

  const readinessItems = [
    {
      label: "Connect a wallet",
      status: isConnected ? "Done" : "Required",
      detail: isConnected
        ? address
        : "Connect a wallet to unlock live Arc wallet balance and activity."
    },
    {
      label: "Use Arc Testnet",
      status: !isConnected ? "Pending" : onArc ? "Ready" : "Switch",
      detail: !isConnected
        ? "The app is already configured for Arc Testnet."
        : onArc
          ? "Your wallet is on Chain ID 5042002."
          : "Move your wallet to Arc Testnet before onchain actions."
    },
    {
      label: "Read wallet context",
      status: !isConnected
        ? "Placeholder"
        : balanceStatus === "loading"
          ? "Loading"
          : balanceStatus === "ready"
            ? "Live"
            : "Retry",
      detail: !isConnected
        ? "Wallet cards stay in placeholder mode until a wallet is connected."
        : balanceStatus === "ready"
          ? `Current Arc USDC balance: ${usdcBalance}`
          : "Balance will appear here once the Arc RPC responds."
    }
  ];

  return (
    <section className="panel section-card" id="section-readiness">
      <div className="section-header">
        <div>
          <p className="eyebrow">Wallet Readiness</p>
          <h2>Launch-safe connection states</h2>
        </div>
        <span className="section-chip">
          {isConnected ? "Live wallet detected" : "Preview mode"}
        </span>
      </div>

      <div className="readiness-list">
        {readinessItems.map((item) => (
          <div key={item.label} className="readiness-row">
            <div className="readiness-copy">
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
            <span className="readiness-pill">{item.status}</span>
          </div>
        ))}
      </div>

      <WalletConnectCta className="wallet-summary-actions" />
    </section>
  );
}

function ArcInfoSection() {
  return (
    <section className="panel section-card" id="section-arc">
      <div className="section-header">
        <div>
          <p className="eyebrow">Arc Testnet</p>
          <h2>Network information</h2>
        </div>
        <span className="section-chip success">Chain ready</span>
      </div>

      <div className="arc-info-grid">
        {ARC_TESTNET_INFO_ITEMS.map((item) => (
          <div key={item.label} className="metric-card arc-info-card">
            <span>{item.label}</span>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.value.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <strong>{item.value}</strong>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityPanel({ activity, activityStatus, activityError, isConnected }) {
  const chipText = !isConnected
    ? "Awaiting wallet"
    : activityStatus === "loading"
      ? "Loading activity..."
      : activityStatus === "refreshing"
        ? "Refreshing..."
        : activityStatus === "error"
          ? "Activity unavailable"
          : activity.length > 0
            ? "Live onchain feed"
            : "No recent events";

  return (
    <section className="panel section-card section-card-wide" id="section-activity">
      <div className="section-header">
        <div>
          <p className="eyebrow">Recent Activity</p>
          <h2>Arc wallet feed</h2>
        </div>
        <span className="section-chip">{chipText}</span>
      </div>

      {!isConnected ? (
        <div className="timeline-empty">
          Connect your wallet and this feed will switch from placeholders to real
          Arc Testnet transfers, approvals, and assistant saves for that address.
        </div>
      ) : activityStatus === "loading" && activity.length === 0 ? (
        <div className="timeline-empty">
          Loading recent Arc wallet activity from the network RPC...
        </div>
      ) : activityError ? (
        <div className="timeline-empty timeline-empty-error">
          {activityError}
        </div>
      ) : activity.length === 0 ? (
        <div className="timeline-empty">
          No recent Arc wallet activity was found in the current onchain
          lookback window.
        </div>
      ) : (
        <div className="timeline">
          {activity.map((event) => {
            const RowTag = event.explorerUrl ? "a" : "div";
            const rowProps = event.explorerUrl
              ? {
                  href: event.explorerUrl,
                  target: "_blank",
                  rel: "noreferrer"
                }
              : {};

            return (
              <RowTag
                key={event.id}
                className={
                  event.explorerUrl
                    ? "timeline-row timeline-link-row"
                    : "timeline-row"
                }
                {...rowProps}
              >
                <span className="timeline-dot" />
                <div className="timeline-copy">
                  <strong>{event.title}</strong>
                  <span>{event.meta}</span>
                  {event.detail ? <span>{event.detail}</span> : null}
                </div>
                <span className="timeline-value">{event.value}</span>
              </RowTag>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">Built On</p>
        <strong>Arc</strong>
      </div>
      <div className="footer-links">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={ARC_DOCS_URL} target="_blank" rel="noreferrer">
          Arc Docs
        </a>
        <a href={arcTestnet.blockExplorers.default.url} target="_blank" rel="noreferrer">
          ArcScan
        </a>
      </div>
    </footer>
  );
}

export default function Home({ assistantMode }) {
  const walletSnapshot = useArcWalletSnapshot();
  const {
    activity,
    status: activityStatus,
    error: activityError
  } = useArcWalletActivity(walletSnapshot.address);

  const statCards = buildOverviewCards(
    walletSnapshot,
    activity,
    activityStatus
  );

  return (
    <>
      <Head>
        <title>arc-ai-wallet</title>
        <meta
          name="description"
          content="arc-ai-wallet is a polished public dashboard for Arc wallets with live Arc USDC balance, onchain activity, and AI assistance."
        />
        <meta name="theme-color" content="#02050b" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="arc-ai-wallet" />
        <meta property="og:title" content="arc-ai-wallet" />
        <meta
          property="og:description"
          content="Your AI-powered command center for Arc wallets."
        />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="arc-ai-wallet" />
        <meta
          name="twitter:description"
          content="Your AI-powered command center for Arc wallets."
        />
      </Head>

      <main className="dashboard-shell">
        <Sidebar />

        <section className="content">
          <header className="hero panel" id="section-overview">
            <div className="hero-copy">
              <p className="eyebrow">Arc AI Wallet</p>
              <h2>Your AI-powered command center for Arc wallets.</h2>
              <p className="hero-text">
                Monitor Arc USDC balance, review live onchain activity, and use
                a polished assistant experience that stays grounded in the
                wallet context currently visible on the dashboard.
              </p>
              <div className="hero-tags">
                <span>Arc Testnet</span>
                <span>USDC Gas</span>
                <span>Onchain Assistant</span>
              </div>
              <WalletConnectCta />
            </div>

            <div className="hero-side" id="section-wallet">
              <WalletConnect walletSnapshot={walletSnapshot} />
            </div>
          </header>

          <section className="stats-grid">
            {statCards.map((card) => (
              <SummaryCard key={card.label} card={card} />
            ))}
          </section>

          <section className="detail-grid">
            <WalletReadiness walletSnapshot={walletSnapshot} />
            <ArcInfoSection />
          </section>

          <ActivityPanel
            activity={activity}
            activityStatus={activityStatus}
            activityError={activityError}
            isConnected={walletSnapshot.isConnected}
          />

          <WalletAssistant
            activity={activity}
            activityStatus={activityStatus}
            activityError={activityError}
            statCards={statCards}
            chainMetrics={chainMetrics}
            assistantMode={assistantMode}
            walletSnapshot={walletSnapshot}
          />

          <Footer />
        </section>
      </main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {
      assistantMode: process.env.OPENAI_API_KEY ? "openai" : "local"
    },
    revalidate: 30
  };
}
