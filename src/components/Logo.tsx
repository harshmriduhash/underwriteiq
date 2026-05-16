import { Link } from "@tanstack/react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${dim} rounded-md bg-[var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)] transition-transform group-hover:scale-105`}>
        <span className="font-mono text-primary-foreground font-bold text-sm">U</span>
      </div>
      <span className={`${text} font-semibold tracking-tight`}>
        Underwrite<span className="text-primary">IQ</span>
      </span>
    </Link>
  );
}
