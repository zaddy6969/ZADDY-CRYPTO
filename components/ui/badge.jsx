import { cn } from "../../lib/cn";

const TONES = {
  neutral: "border-white/10 bg-white/5 text-slate-200",
  blue: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  red: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-100"
};

export function Badge({ className, tone = "neutral", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
