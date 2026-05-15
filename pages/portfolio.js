import Head from "next/head";
import AppNav from "../components/app-nav";
import PortfolioShell from "../components/portfolio/portfolio-shell";
import SiteFooter from "../components/site-footer";
import { useArcPortfolio } from "../lib/use-arc-portfolio";
import { useArcWalletActivity } from "../lib/use-arc-wallet-activity";
import { useArcWalletSnapshot } from "../lib/use-arc-wallet-snapshot";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arc-ai-wallet.vercel.app";

export default function PortfolioPage() {
  const walletSnapshot = useArcWalletSnapshot();
  const portfolio = useArcPortfolio(walletSnapshot.address);
  const {
    activity,
    status: activityStatus,
    error: activityError
  } = useArcWalletActivity(walletSnapshot.address);

  return (
    <>
      <Head>
        <title>Portfolio | Arc AI Wallet</title>
        <meta
          name="description"
          content="A premium Arc portfolio dashboard with live wallet balances, activity, and AI insights."
        />
        <meta name="theme-color" content="#070b14" />
        <link rel="canonical" href={`${SITE_URL}/portfolio`} />
      </Head>

      <main className="min-h-screen bg-arc-shell px-3 pb-10 pt-4 text-white sm:px-4 lg:px-6">
        <AppNav />
        <div className="mx-auto mt-6 grid w-full max-w-[1120px] gap-6">
          <PortfolioShell
            walletSnapshot={walletSnapshot}
            portfolio={portfolio}
            activity={activity}
            activityStatus={activityStatus}
            activityError={activityError}
          />
          <SiteFooter />
        </div>
      </main>
    </>
  );
}
