import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-3", className)}>
      <img
        src="/logo_header.png"
        alt="YBB Logo"
        className={cn(
          "h-10 w-auto object-contain transition-opacity group-hover:opacity-90 origin-left scale-x-110",
          tone === "light" && "brightness-0 invert",
        )}
      />
    </Link>
  );
}
