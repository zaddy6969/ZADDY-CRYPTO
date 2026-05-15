import Head from "next/head";
import Link from "next/link";
import AppNav from "../components/app-nav";
import BridgeToArcPanel from "../components/bridge-to-arc-panel";
import PortfolioSummary from "../components/portfolio-summary";
import SiteFooter from "../components/site-footer";
import TransactionActivity from "../components/transaction-activity";
import WalletAssistant from "../components/wallet-assistant";
import WalletConnect, {
  WalletConnectCta
} from "../components/wallet-connect";
import { arcTestnet } from "../lib/arc-chain";
import assistantDeployment from "../lib/generated/arc-assistant-deployment.json";
import {
  buildPortfolioInsights,
  buildSecuritySignals
} from "../lib/portfolio-page";
import { useArcPortfolio } from "../lib/use-arc-portfolio";
import { useArcWalletActivity } from "../lib/use-arc-wallet-activity";
import { useArcWalletSnapshot } from "../lib/use-arc-wallet-snapshot";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arc-ai-wallet.vercel.app";

const CONTRACT_URL = `${arcTestnet.blockExplorers.default.url}/address/${assistantDeployment.address}`;

function Hero({ isSignedIn }) {
  return (
    <section className="hero-card">
      <p className="section-kicker">Arc AI Wallet</p>
      <h1>Arc AI Wallet</h1>
      <p className="hero-subtitle">
        AI-powered wallet intelligence built on Arc.
      </p>
      <div className="hero-meta">
        <span>Arc Testnet</span>
        <span>Chain ID 5042002</span>
        <span>USDC gas</span>
      </div>
      <div className="hero-actions">
        {!isSignedIn ? <WalletConnectCta className="hero-actions-inline" /> : null}
        <Link href="/portfolio" className="button button-primary">
          Open Portfolio Dashboard
        </Link>
        <a
          href={CONTRACT_URL}
          target="_blank"
          rel="noreferrer"
          className="button button-secondary"
        >
          View Contract on ArcScan
        </a>
      </div>
    </section>
  );
}

function HomePortfolioGateway({ isSignedIn }) {
  return (
    <section className="card portfolio-launch-card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">New Portfolio</p>
          <h2>Open the full Arc portfolio dashboard</h2>
        </div>
        <span className="status-badge status-good">Live now</span>
      </div>

      <div className="portfolio-launch-grid">
        <div className="portfolio-launch-copy">
          <strong>Portfolio is now a separate premium workspace inside the app.</strong>
          <p>
            View wallet overview, live supported Arc balances, analytics charts,
            transaction feed, AI insights, security monitoring, and quick wallet
            actions from one dedicated page.
          </p>
          <div className="hero-actions">
            <Link href="/portfolio" className="button button-primary">
              Open Portfolio Dashboard
            </Link>
            {!isSignedIn ? (
              <span className="helper-copy">
                Connect your wallet after opening it to load live balances.
              </span>
            ) : (
              <span className="helper-copy">
                Your connected wallet data will carry straight into the portfolio page.
              </span>
            )}
          </div>
        </div>

        <div className="portfolio-launch-preview">
          <div className="portfolio-preview-chip">Wallet overview</div>
          <div className="portfolio-preview-chip">Assets + search</div>
          <div className="portfolio-preview-chip">24H / 7D / 30D analytics</div>
          <div className="portfolio-preview-chip">Arc activity feed</div>
          <div className="portfolio-preview-chip">AI wallet insights</div>
          <div className="portfolio-preview-chip">Security monitoring</div>
        </div>
      </div>
    </section>
  );
}

function DemoPreviewCard({ kicker, title, body, points }) {
  return (
    <article className="demo-preview-card">
      <p className="section-kicker">{kicker}</p>
      <strong>{title}</strong>
      <p>{body}</p>
      <div className="demo-preview-points">
        {points.map((point) => (
          <span key={point} className="demo-preview-point">
            {point}
          </span>
        ))}
      </div>
    </article>
  );
}

function DemoShowcase() {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Demo Mode</p>
          <h2>Explore the app before connecting a wallet</h2>
        </div>
        <span className="status-badge">Preview available</span>
      </div>

      <div className="demo-preview-grid">
        <DemoPreviewCard
          kicker="Portfolio Preview"
          title="Live portfolio layout"
          body="See the structure for wallet overview, tracked assets, analytics, and recent activity before connecting."
          points={["Wallet overview", "Asset cards", "Analytics charts"]}
        />
        <DemoPreviewCard
          kicker="AI Wallet Assistant"
          title="Copilot-first experience"
          body="The assistant explains balances, summarizes activity, and helps users understand Arc wallet behavior."
          points={["Balance analysis", "Risk checks", "Action prompts"]}
        />
        <DemoPreviewCard
          kicker="Transaction Activity"
          title="Readable Arc wallet feed"
          body="Recent transfers and approvals are turned into clean cards with labels, timestamps, and ArcScan links."
          points={["Sent / received", "Approval flow", "ArcScan links"]}
        />
        <DemoPreviewCard
          kicker="Arc Testnet Support"
          title="Built for Arc from day one"
          body="Arc Testnet network details, USDC gas model, and contract links are part of the default experience."
          points={["Chain ID 5042002", "USDC gas", "Arc RPC + explorer"]}
        />
      </div>
    </section>
  );
}

function WalletHealthSection({ walletSnapshot, activityStatus, portfolio, activity }) {
  const insights = buildPortfolioInsights(walletSnapshot, portfolio, activity);
  const security = buildSecuritySignals(walletSnapshot, activityStatus, insights);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Wallet Health</p>
          <h2>Real-time trust and risk posture</h2>
        </div>
        <span className="status-badge status-good">Live scoring</span>
      </div>

      <div className="health-score-grid">
        <div className="health-score-card">
          <span className="field-label">Wallet health score</span>
          <strong>{security.score}/100</strong>
          <small>
            {walletSnapshot?.isSignedIn
              ? "Computed from network state, activity coverage, and approval exposure."
              : "Preview score shown. Connect your wallet for a live score."}
          </small>
        </div>
        <div className="health-score-card">
          <span className="field-label">Risk level</span>
          <strong>{insights.riskLabel}</strong>
          <small>{insights.summary}</small>
        </div>
        <div className="health-score-card">
          <span className="field-label">Session state</span>
          <strong>{security.session}</strong>
          <small>{security.monitoring}</small>
        </div>
      </div>
    </section>
  );
}

function GuidedJourneySection() {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">User Journey</p>
          <h2>How the wallet experience unfolds</h2>
        </div>
      </div>
      <div className="demo-preview-grid">
        {[
          ["01", "Connect wallet", "Use RainbowKit or WalletConnect to sign in on Arc Testnet."],
          ["02", "Wallet scan", "Arc balances, token holdings, and recent activity load automatically."],
          ["03", "AI analysis", "Copilot summarizes portfolio health, risk, and recent wallet behavior."],
          ["04", "Review activity", "See readable transaction cards, approvals, and recent onchain events."],
          ["05", "Take action", "Use guided prompts or Send USDC with wallet confirmation on Arc."],
          ["06", "Save memory", "Store useful wallet insights on the deployed Arc assistant contract."]
        ].map(([step, title, body]) => (
          <article key={step} className="demo-preview-card">
            <span className="field-label">{step}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhyArcSection() {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Why Built on Arc</p>
          <h2>Arc is a natural home for AI-native wallets</h2>
        </div>
        <span className="status-badge">Arc ecosystem</span>
      </div>
      <div className="demo-preview-grid">
        <article className="demo-preview-card">
          <span className="field-label">USDC Gas</span>
          <strong>Payments feel familiar</strong>
          <p>
            Arc uses USDC for gas, which makes wallet balances and fees easier to
            understand for both humans and AI copilots.
          </p>
        </article>
        <article className="demo-preview-card">
          <span className="field-label">Fast Settlement</span>
          <strong>Responsive wallet UX</strong>
          <p>
            Fast confirmation loops make live portfolio tracking and AI-assisted
            actions feel immediate instead of speculative.
          </p>
        </article>
        <article className="demo-preview-card">
          <span className="field-label">AI-Native Infra</span>
          <strong>Built for smart agents</strong>
          <p>
            Arc’s ecosystem fits products where AI explains transactions, detects
            risk, and helps users take wallet actions safely.
          </p>
        </article>
        <article className="demo-preview-card">
          <span className="field-label">Circle Alignment</span>
          <strong>Stablecoin-centric flows</strong>
          <p>
            Circle-style stablecoin payment flows map cleanly to Arc’s wallet
            model, treasury tracking, and spend automation.
          </p>
        </article>
      </div>
    </section>
  );
}

function LandingState() {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Onboarding</p>
          <h2>Start with one wallet connection</h2>
        </div>
      </div>
      <div className="login-logo-stage" aria-hidden="true">
        <span className="login-logo-orb login-logo-orb-left" />
        <span className="login-logo-orb login-logo-orb-right" />
        <span className="login-logo-ring" />
        <div className="login-logo-shell">
          <img
            src="/arc-ai-wallet-logo.png"
            alt=""
            className="login-logo-image"
          />
        </div>
      </div>
      <div className="onboarding-grid">
        <div className="empty-state">
          <strong>Connect wallet to sign in.</strong>
          <p>
            Arc AI Wallet turns balances, transfers, and approvals into clear
            wallet guidance as soon as you connect.
          </p>
          <WalletConnectCta className="hero-actions" />
        </div>
        <div className="onboarding-list">
          <div className="onboarding-item">
            <span className="field-label">01</span>
            <strong>Connect your Arc wallet</strong>
            <p>Use RainbowKit to sign in and switch to Arc Testnet.</p>
          </div>
          <div className="onboarding-item">
            <span className="field-label">02</span>
            <strong>Review live wallet activity</strong>
            <p>See recent transfers and approvals in a clean, readable feed.</p>
          </div>
          <div className="onboarding-item">
            <span className="field-label">03</span>
            <strong>Ask your wallet copilot</strong>
            <p>Get short AI answers about risk, balances, and recent activity.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const walletSnapshot = useArcWalletSnapshot();
  const portfolio = useArcPortfolio(walletSnapshot.address);
  const {
    activity,
    status: activityStatus,
    error: activityError
  } = useArcWalletActivity(walletSnapshot.address);
  const isSignedIn = walletSnapshot.isSignedIn;

  return (
    <>
      <Head>
        <title>Arc AI Wallet | Built on Arc</title>
        <meta
          name="description"
          content="AI-powered wallet intelligence built on Arc."
        />
        <meta name="theme-color" content="#070b14" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Arc AI Wallet | Built on Arc" />
        <meta property="og:title" content="Arc AI Wallet | Built on Arc" />
        <meta
          property="og:description"
          content="AI-powered wallet intelligence built on Arc."
        />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arc AI Wallet | Built on Arc" />
        <meta
          name="twitter:description"
          content="AI-powered wallet intelligence built on Arc."
        />
      </Head>

      <main className="page-shell">
        <div className="page-frame">
          <AppNav />
          <Hero isSignedIn={isSignedIn} />
          <HomePortfolioGateway isSignedIn={isSignedIn} />
          <WalletConnect walletSnapshot={walletSnapshot} />
          <WalletHealthSection
            walletSnapshot={walletSnapshot}
            activityStatus={activityStatus}
            portfolio={portfolio}
            activity={activity}
          />
          {!isSignedIn ? <DemoShowcase /> : null}
          <GuidedJourneySection />
          <WhyArcSection />
          <BridgeToArcPanel walletSnapshot={walletSnapshot} />
          <WalletAssistant
            walletSnapshot={walletSnapshot}
            portfolio={portfolio}
            activity={activity}
            activityStatus={activityStatus}
          />
          <PortfolioSummary
            walletSnapshot={walletSnapshot}
            portfolio={portfolio}
          />
          <TransactionActivity
            isSignedIn={isSignedIn}
            activity={activity}
            status={activityStatus}
            error={activityError}
          />
          {!isSignedIn ? <LandingState /> : null}
          <SiteFooter />
        </div>
      </main>
    </>
  );
}
