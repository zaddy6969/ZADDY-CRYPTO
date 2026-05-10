import Head from "next/head";
import TransactionAnalyzer from "../components/transaction-analyzer";
import WalletAssistant from "../components/wallet-assistant";
import WalletConnect from "../components/wallet-connect";
import {
  formatMarketUpdatedAt,
  formatPercentChange,
  formatUsdPrice,
  getLiveMarketPrices
} from "../lib/market-prices";
import { useMarketPrices } from "../lib/use-market-prices";

const navItems = [
  { label: "Overview", id: "section-overview" },
  { label: "Wallet Hub", id: "section-wallet" },
  { label: "Treasury", id: "section-treasury" },
  { label: "Agents", id: "section-agents" },
  { label: "Signals", id: "section-signals" },
  { label: "Activity", id: "section-activity" },
  { label: "Analyzer", id: "section-analyzer" },
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
  { label: "USDC", share: 42, color: "var(--accent-cyan)" },
  { label: "BTC", share: 23, color: "var(--accent-gold)" },
  { label: "ETH", share: 18, color: "var(--accent-green)" },
  { label: "Yield", share: 11, color: "var(--accent-rose)" },
  { label: "Experimental", share: 6, color: "var(--accent-steel)" }
];

const activity = [
  {
    title: "Treasury rebalanced into USDC",
    meta: "2 minutes ago",
    value: "$18,000 routed"
  },
  {
    title: "Agent escrow funded on Arc",
    meta: "18 minutes ago",
    value: "12,500 USDC"
  },
  {
    title: "Wallet session approved",
    meta: "43 minutes ago",
    value: "Arc Testnet"
  },
  {
    title: "Yield vault alert triggered",
    meta: "1 hour ago",
    value: "APY dipped 0.8%"
  }
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
          <stop offset="0%" stopColor="rgba(74, 227, 181, 0.55)" />
          <stop offset="100%" stopColor="rgba(74, 227, 181, 0)" />
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

function MoversPanel({ marketData, status }) {
  const assets = marketData?.assets || [];
  const chipText =
    status === "loading"
      ? "Refreshing prices..."
      : marketData?.sourceStatus === "stale"
        ? "Cached live prices"
        : marketData?.updatedAt
          ? `Updated ${formatMarketUpdatedAt(marketData.updatedAt)}`
          : "Live feed unavailable";

  return (
    <div className="panel section-card" id="section-signals">
      <div className="section-header">
        <div>
          <p className="eyebrow">Signals</p>
          <h2>Live token prices</h2>
        </div>
        <span className="section-chip">{chipText}</span>
      </div>

      <div className="movers-list">
        {assets.map((asset) => (
          <div key={asset.symbol} className="mover-row">
            <div className="mover-symbol">{asset.symbol}</div>
            <div className="mover-copy">
              <strong>{asset.name}</strong>
              <span>{formatUsdPrice(asset.priceUsd)}</span>
            </div>
            <span
              className={
                Number.isFinite(asset.change24h)
                  ? asset.change24h < 0
                    ? "delta negative"
                    : "delta positive"
                  : "delta"
              }
            >
              {formatPercentChange(asset.change24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="panel section-card" id="section-activity">
      <div className="section-header">
        <div>
          <p className="eyebrow">Recent Activity</p>
          <h2>Ops feed</h2>
        </div>
        <span className="section-chip">Live queue</span>
      </div>

      <div className="timeline">
        {activity.map((event) => (
          <div key={event.title} className="timeline-row">
            <span className="timeline-dot" />
            <div className="timeline-copy">
              <strong>{event.title}</strong>
              <span>{event.meta}</span>
            </div>
            <span className="timeline-value">{event.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home({ assistantMode, initialMarketData }) {
  const { marketData, status: marketStatus } = useMarketPrices(initialMarketData);

  return (
    <>
      <Head>
        <title>arc-ai-wallet</title>
        <meta
          name="description"
          content="arc-ai-wallet is a modern Arc Testnet wallet dashboard with AI assistance and transaction analysis."
        />
      </Head>

      <main className="dashboard-shell">
        <Sidebar />

        <section className="content">
          <header className="hero panel" id="section-overview">
            <div className="hero-copy">
              <p className="eyebrow">Arc AI Wallet</p>
              <h2>Track your Arc wallet, understand transactions, and get AI help from one dark command center.</h2>
              <p className="hero-text">
                A polished Next.js product for Arc Testnet users who need wallet visibility,
                USDC balance tracking, transaction explanations, and responsive AI-assisted monitoring.
              </p>
              <div className="hero-tags">
                <span>Wallet Connect</span>
                <span>AI Assistant</span>
                <span>Arc Testnet</span>
              </div>
            </div>

            <div className="hero-side" id="section-wallet">
              <WalletConnect marketData={marketData} />
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
            <MoversPanel marketData={marketData} status={marketStatus} />
            <ActivityPanel />
          </section>

          <TransactionAnalyzer />

          <WalletAssistant
            activity={activity}
            statCards={statCards}
            chainMetrics={chainMetrics}
            assistantMode={assistantMode}
          />
        </section>
      </main>
    </>
  );
}

export async function getStaticProps() {
  const initialMarketData = await getLiveMarketPrices();

  return {
    props: {
      assistantMode: process.env.OPENAI_API_KEY ? "openai" : "local",
      initialMarketData
    },
    revalidate: 30
  };
}
