import Head from "next/head";
import WalletAssistant from "../components/wallet-assistant";
import WalletConnect from "../components/wallet-connect";
import { useArcWalletActivity } from "../lib/use-arc-wallet-activity";
import { useArcWalletSnapshot } from "../lib/use-arc-wallet-snapshot";

const navItems = [
  { label: "Overview", id: "section-overview" },
  { label: "Wallet Hub", id: "section-wallet" },
  { label: "Treasury", id: "section-treasury" },
  { label: "Agents", id: "section-agents" },
  { label: "Activity", id: "section-activity" },
  { label: "Assistant", id: "section-assistant" }
];

const statCards = [
  {
    label: "Portfolio Value",
    value: "$482,190",
    change: "+12.4%",
    tone: "positive",
    points: [18, 28, 26, 34, 38, 48, 52]
  },
  {
    label: "Stable Liquidity",
    value: "$184,200",
    change: "+4.7%",
    tone: "positive",
    points: [20, 18, 22, 24, 28, 30, 34]
  },
  {
    label: "Gas Runway",
    value: "44.8 days",
    change: "-1.2%",
    tone: "warning",
    points: [40, 42, 39, 37, 34, 33, 31]
  },
  {
    label: "Active Strategies",
    value: "7 live",
    change: "2 pending",
    tone: "neutral",
    points: [12, 18, 24, 22, 30, 34, 40]
  }
];

const allocation = [
  { label: "USDC", share: 42, color: "var(--accent-secondary)" },
  { label: "BTC", share: 23, color: "var(--accent-primary)" },
  { label: "ETH", share: 18, color: "var(--accent-soft)" },
  { label: "Yield", share: 11, color: "var(--accent-tertiary)" },
  { label: "Experimental", share: 6, color: "#29476f" }
];

const chainMetrics = [
  { label: "Network", value: "Arc Testnet" },
  { label: "Chain ID", value: "5042002" },
  { label: "Gas Asset", value: "USDC" },
  { label: "RPC", value: "rpc.testnet.arc.network" }
];

function Sparkline({ points }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = 160 / (points.length - 1);
  const coordinates = points
    .map((point, index) => {
      const x = index * step;
      const y = 50 - ((point - min) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 160 56" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(53, 196, 255, 0.45)" />
          <stop offset="100%" stopColor="rgba(53, 196, 255, 0)" />
        </linearGradient>
      </defs>
      <polyline points={`0,54 ${coordinates} 160,54`} fill="url(#spark-fill)" stroke="none" />
      <polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
          <a key={item.label} href={`#${item.id}`} className={index === 0 ? "nav-item active" : "nav-item"}>
            <span className="nav-dot" />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        <p className="eyebrow">Live Mode</p>
        <strong>USDC-native execution</strong>
        <span>Fast monitoring for wallets, treasury movement, and strategy health.</span>
      </div>
    </aside>
  );
}

function SummaryCard({ card }) {
  return (
    <article className="panel stat-card">
      <div className="stat-copy">
        <span className="eyebrow">{card.label}</span>
        <strong>{card.value}</strong>
        <span className={`delta ${card.tone}`}>{card.change}</span>
      </div>
      <Sparkline points={card.points} />
    </article>
  );
}

function AllocationChart() {
  return (
    <div className="panel section-card" id="section-treasury">
      <div className="section-header">
        <div>
          <p className="eyebrow">Allocation</p>
          <h2>Portfolio spread</h2>
        </div>
        <span className="section-chip">Updated 30s ago</span>
      </div>

      <div className="allocation-stack" aria-hidden="true">
        {allocation.map((item) => (
          <span
            key={item.label}
            className="allocation-segment"
            style={{ width: `${item.share}%`, background: item.color }}
          />
        ))}
      </div>

      <div className="allocation-list">
        {allocation.map((item) => (
          <div key={item.label} className="allocation-row">
            <div className="allocation-label">
              <span className="allocation-swatch" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
            <strong>{item.share}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChainMonitor() {
  return (
    <div className="panel section-card" id="section-agents">
      <div className="section-header">
        <div>
          <p className="eyebrow">Network</p>
          <h2>Arc monitor</h2>
        </div>
        <span className="section-chip success">Healthy</span>
      </div>

      <div className="metric-grid">
        {chainMetrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="progress-cluster">
        <div>
          <div className="progress-copy">
            <span>RPC throughput</span>
            <strong>92%</strong>
          </div>
          <div className="progress-rail">
            <span style={{ width: "92%" }} />
          </div>
        </div>
        <div>
          <div className="progress-copy">
            <span>Wallet sync</span>
            <strong>87%</strong>
          </div>
          <div className="progress-rail">
            <span style={{ width: "87%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityPanel({ activity, activityStatus, activityError, isConnected }) {
  const chipText =
    !isConnected
      ? "Connect wallet"
      : activityStatus === "loading"
        ? "Loading Arc activity..."
        : activityStatus === "refreshing"
          ? "Refreshing Arc activity..."
          : activityStatus === "error"
            ? "Activity unavailable"
            : activity.length > 0
              ? "Live onchain feed"
              : "No recent events";

  return (
    <div className="panel section-card" id="section-activity">
      <div className="section-header">
        <div>
          <p className="eyebrow">Recent Activity</p>
          <h2>Ops feed</h2>
        </div>
        <span className="section-chip">{chipText}</span>
      </div>

      {!isConnected ? (
        <div className="timeline-empty">
          Connect your wallet and this panel will show real Arc Testnet transfers, approvals, and assistant saves for that address.
        </div>
      ) : activityStatus === "loading" && activity.length === 0 ? (
        <div className="timeline-empty">
          Loading recent Arc wallet activity from the RPC...
        </div>
      ) : activityError ? (
        <div className="timeline-empty timeline-empty-error">{activityError}</div>
      ) : activity.length === 0 ? (
        <div className="timeline-empty">
          No recent Arc wallet activity was found in the current onchain lookback window.
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
                className={event.explorerUrl ? "timeline-row timeline-link-row" : "timeline-row"}
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
    </div>
  );
}

export default function Home({ assistantMode }) {
  const walletSnapshot = useArcWalletSnapshot();
  const {
    activity,
    status: activityStatus,
    error: activityError
  } = useArcWalletActivity(walletSnapshot.address);

  return (
    <>
      <Head>
        <title>arc-ai-wallet</title>
        <meta
          name="description"
          content="arc-ai-wallet is a modern Arc Testnet wallet dashboard with Arc-native wallet tracking, AI assistance, and live onchain activity."
        />
      </Head>

      <main className="dashboard-shell">
        <Sidebar />

        <section className="content">
          <header className="hero panel" id="section-overview">
            <div className="hero-copy">
              <p className="eyebrow">Arc AI Wallet</p>
              <h2>Track your Arc wallet, review live onchain activity, and get AI help from one Arc-native command center.</h2>
              <p className="hero-text">
                A polished Next.js product for Arc Testnet users who need wallet visibility,
                USDC balance tracking, assistant memory onchain, and responsive AI-assisted monitoring.
              </p>
              <div className="hero-tags">
                <span>Wallet Connect</span>
                <span>AI Assistant</span>
                <span>Onchain Activity</span>
              </div>
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
            <AllocationChart />
            <ChainMonitor />
            <ActivityPanel
              activity={activity}
              activityStatus={activityStatus}
              activityError={activityError}
              isConnected={walletSnapshot.isConnected}
            />
          </section>

          <WalletAssistant
            activity={activity}
            activityStatus={activityStatus}
            activityError={activityError}
            statCards={statCards}
            chainMetrics={chainMetrics}
            assistantMode={assistantMode}
            walletSnapshot={walletSnapshot}
          />
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
