import Link from "next/link";
import { arcTestnet } from "../lib/arc-chain";

export default function AppNav() {
  return (
    <header className="sticky top-4 z-40">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-[rgba(8,13,24,0.78)] px-4 py-3 shadow-glass backdrop-blur-xl md:px-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <img
              src="/arc-ai-wallet-logo.png"
              alt="Arc AI Wallet"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Arc AI Wallet
            </p>
            <p className="truncate text-xs text-slate-400">
              Built on {arcTestnet.name}
            </p>
          </div>
        </Link>

        <span className="status-badge status-good">Live on Arc Testnet</span>
      </div>
    </header>
  );
}
