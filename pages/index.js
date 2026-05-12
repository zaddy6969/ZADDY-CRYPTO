import Head from "next/head";
import PortfolioSummary from "../components/portfolio-summary";
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

const GITHUB_URL = "https://github.com/zaddy6969/ZADDY-CRYPTO";
const X_URL = "https://x.com/ARC_AI_WALLET";
const ARC_DOCS_URL = "https://docs.arc.network/";
const CONTRACT_URL = `${arcTestnet.blockExplorers.default.url}/address/${assistantDeployment.address}`;

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <p className="section-kicker">Ecosystem</p>
        <strong>Build on Arc</strong>
      </div>
      <div className="footer-links">
        <a href={X_URL} target="_blank" rel="noreferrer">
          X
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={ARC_DOCS_URL} target="_blank" rel="noreferrer">
          Arc Docs
        </a>
        <a
          href={arcTestnet.blockExplorers.default.url}
          target="_blank"
          rel="noreferrer"
        >
          ArcScan
        </a>
      </div>
    </footer>
  );
}

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
          <Hero isSignedIn={isSignedIn} />

          {!isSignedIn ? (
            <>
              <LandingState />
              <Footer />
            </>
          ) : (
            <>
              <WalletAssistant
                walletSnapshot={walletSnapshot}
                portfolio={portfolio}
                activity={activity}
                activityStatus={activityStatus}
              />
              <WalletConnect walletSnapshot={walletSnapshot} />
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
              <Footer />
            </>
          )}
        </div>
      </main>
    </>
  );
}
