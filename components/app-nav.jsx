import Link from "next/link";
import { useRouter } from "next/router";
import { arcTestnet } from "../lib/arc-chain";
import { cn } from "../lib/cn";
import { Badge } from "./ui/badge";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" }
];

export default function AppNav() {
  const router = useRouter();

  return (
    <header className="sticky top-4 z-40">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-[rgba(8,13,24,0.78)] px-4 py-3 shadow-glass backdrop-blur-xl md:px-5">
        <div className="flex items-center gap-3">
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
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = router.pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/portfolio"
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              router.pathname === "/portfolio"
                ? "border-sky-300/30 bg-sky-400/10 text-sky-100"
                : "border-white/10 bg-white/5 text-white hover:border-sky-300/30 hover:bg-white/8"
            )}
          >
            Open Portfolio
          </Link>
          <Badge tone="blue">Live on Arc Testnet</Badge>
        </div>
      </div>

      <nav className="mx-auto mt-3 flex w-full max-w-[1120px] items-center gap-2 overflow-x-auto rounded-[22px] border border-white/10 bg-[rgba(8,13,24,0.64)] p-2 backdrop-blur-xl md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
