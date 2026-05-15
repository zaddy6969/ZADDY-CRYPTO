import Head from "next/head";
import Link from "next/link";
import AppNav from "../components/app-nav";
import PortfolioSummary from "../components/portfolio-summary";
import SiteFooter from "../components/site-footer";
import TransactionActivity from "../components/transaction-activity";
import WalletAssistant from "../components/wallet-assistant";
import WalletConnect, {
  WalletConnectCta
} from "../components/wallet-connect";
import { arcTestnet } from "../lib/arc-chain";
import assistantDeployment from "../lib/generated/arc-assistant-deployment.json";
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
          {!isSignedIn ? <DemoShowcase /> : null}

          {!isSignedIn ? (
            <>
              <LandingState />
              <SiteFooter />
            </>
          ) : (
            <>
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
              <SiteFooter />
            </>
          )}
        </div>
      </main>
    </>
  );
}
