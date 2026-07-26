import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Wordmark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl font-display text-sm font-bold tracking-tight",
          tone === "dark"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground",
        )}
      >
        YBB
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-sm font-semibold",
            tone === "dark" ? "text-foreground" : "text-background",
          )}
        >
          Yoova Business Broking
        </span>
        <span
          className={cn(
            "block text-[11px] uppercase tracking-[0.16em]",
            tone === "dark" ? "text-muted-foreground" : "text-background/70",
          )}
        >
          ABB Certification
        </span>
      </span>
    </Link>
  );
}
