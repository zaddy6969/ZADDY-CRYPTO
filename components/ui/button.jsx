import { cn } from "../../lib/cn";

const VARIANTS = {
  primary:
    "border-transparent bg-gradient-to-r from-sky-400 to-violet-500 text-slate-950 shadow-glow hover:shadow-[0_20px_70px_rgba(102,182,255,0.24)]",
  secondary:
    "border-white/10 bg-white/5 text-white hover:border-sky-300/30 hover:bg-white/8",
  ghost:
    "border-transparent bg-transparent text-slate-200 hover:bg-white/5"
};

const SIZES = {
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
  icon: "h-11 w-11 px-0"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold transition duration-200 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    />
  );
}
