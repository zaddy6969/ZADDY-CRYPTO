import Head from "next/head";
import Link from "next/link";
import AppShell from "../components/app-shell";
import WalletConnect from "../components/wallet-connect";
import { ARC_TESTNET_INFO_ITEMS, arcTestnet } from "../lib/arc-chain";
import { useUnifiedBalanceSummary } from "../lib/use-unified-balance-summary";
import { useWalletAppState } from "../lib/use-wallet-app-state";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arc-ai-wallet.vercel.app";

function QuickActionCard({ href, kicker, title, body }) {
  return (
    <Link href={href} className="demo-preview-card">
      <p className="section-kicker">{kicker}</p>
      <strong>{title}</strong>
      <p>{body}</p>
    </Link>
  );
}

export default function Home() {
  const {
    walletSnapshot,
    mergedActivity
  } = useWalletAppState();
  const { summary: unifiedBalance } = useUnifiedBalanceSummary(
    walletSnapshot.isSignedIn
  );
  const recentItems = mergedActivity.slice(0, 3);

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
            </div>
          </div>
          <div className="hero-actions">
            <Link href="/send" className="button button-primary">
              Send USDC
            </Link>
            <Link href="/bridge" className="button button-secondary">
              Bridge USDC
            </Link>
            <Link href="/unified-balance" className="button button-secondary">
              Unified Balance
            </Link>
            <Link href="/assistant" className="button button-secondary">
              AI Assistant
            </Link>
          </div>
        </section>

        <WalletConnect walletSnapshot={walletSnapshot} />

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Quick Actions</p>
              <h2>Core Arc wallet flows</h2>
            </div>
          </div>
          <div className="demo-preview-grid">
            <QuickActionCard
              href="/send"
              kicker="Send"
              title="Send USDC on Arc"
              body="Use App Kit Send to transfer USDC to another wallet on Arc Testnet."
            />
            <QuickActionCard
              href="/bridge"
              kicker="Bridge"
              title="Bridge USDC to Arc"
              body="Move testnet USDC from Ethereum Sepolia or Base Sepolia into Arc Testnet."
            />
            <QuickActionCard
              href="/unified-balance"
              kicker="Unified Balance"
              title="Combine balances"
              body="Deposit USDC from supported chains and spend the combined balance on Arc."
            />
            <QuickActionCard
              href="/assistant"
              kicker="AI Assistant"
              title="Ask Wallet Copilot"
              body="Get clear help with Arc, USDC gas, activity, Send, Bridge, and Unified Balance."
            />
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Arc Testnet</p>
              <h2>Network details</h2>
            </div>
          </div>
          <div className="network-facts-grid">
            {ARC_TESTNET_INFO_ITEMS.map((item) => (
              <div key={item.label} className="network-fact">
                <span className="field-label">{item.label}</span>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.value}
                  </a>
                ) : (
                  <strong>{item.value}</strong>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Activity Preview</p>
              <h2>Latest wallet actions</h2>
            </div>
            <Link href="/activity" className="button button-secondary">
              Open Activity
            </Link>
          </div>

          {!walletSnapshot.isSignedIn ? (
            <div className="empty-state">
              <strong>Connect wallet to load real activity.</strong>
              <p>
                Your Send, Bridge, and Unified Balance actions will appear here
                together with recent Arc onchain activity.
              </p>
            </div>
          ) : recentItems.length === 0 ? (
            <div className="empty-state">
              <strong>No wallet actions yet.</strong>
              <p>
                Start with Send USDC, Bridge USDC, or Unified Balance to build
                a real activity history for this wallet.
              </p>
            </div>
          ) : (
            <div className="activity-feed">
              {recentItems.map((item) => (
                <article key={item.id} className="activity-card">
                  <div className="activity-card-head">
                    <div className="activity-card-copy">
                      <strong>{item.type}</strong>
                      <span>{item.summary}</span>
                    </div>
                    <div className="activity-card-amount">
                      <strong>{item.amount || "Tracked event"}</strong>
                      <span>{item.chain || arcTestnet.name}</span>
                    </div>
                  </div>
                  <div className="activity-card-meta">
                    <span>{item.timeLabel || "Recently"}</span>
                    <span>{item.status || "Confirmed"}</span>
                    {item.txHashShort ? <span>{item.txHashShort}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </AppShell>
    </>
  );
}
