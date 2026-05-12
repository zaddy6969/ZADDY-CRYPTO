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
const ARC_DOCS_URL = "https://docs.arc.network/";
const CONTRACT_URL = `${arcTestnet.blockExplorers.default.url}/address/${assistantDeployment.address}`;

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <p className="section-kicker">Built by</p>
        <strong>Zubair / Zaddy Crypto</strong>
      </div>
      <div className="footer-links">
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
        Simple AI-powered wallet dashboard for Arc Testnet.
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
          <p className="section-kicker">Login</p>
          <h2>Connect wallet to open the dashboard</h2>
        </div>
      </div>
      <div className="empty-state">
        <strong>Connect wallet to sign in.</strong>
        <p>
          After wallet connection, the dashboard unlocks real portfolio
          balances, recent Arc activity, and AI wallet analysis.
        </p>
        <WalletConnectCta className="hero-actions" />
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
        <title>Arc AI Wallet</title>
        <meta
          name="description"
          content="Simple AI-powered wallet dashboard for Arc Testnet."
        />
        <meta name="theme-color" content="#070b14" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Arc AI Wallet" />
        <meta property="og:title" content="Arc AI Wallet" />
        <meta
          property="og:description"
          content="Simple AI-powered wallet dashboard for Arc Testnet."
        />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arc AI Wallet" />
        <meta
          name="twitter:description"
          content="Simple AI-powered wallet dashboard for Arc Testnet."
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
              <WalletAssistant
                walletSnapshot={walletSnapshot}
                portfolio={portfolio}
                activity={activity}
                activityStatus={activityStatus}
              />
              <Footer />
            </>
          )}
        </div>
      </main>
    </>
  );
}
