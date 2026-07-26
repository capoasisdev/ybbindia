import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ScrollText,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/site/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Lessons", icon: BookOpen },
  { to: "/assignments", label: "Assignments", icon: FileCheck2 },
  { to: "/exam", label: "Examination", icon: GraduationCap },
  { to: "/certificate", label: "Certificate", icon: ScrollText },
  { to: "/profile", label: "My profile", icon: UserRound },
  { to: "/tickets", label: "Support", icon: LifeBuoy },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-6 lg:flex">
        <Wordmark tone="light" />

        <nav className="mt-10 flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur lg:hidden">
          <Wordmark />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-border"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </header>

        <div className={cn("border-b border-border bg-card px-5 py-4 lg:hidden", open ? "block" : "hidden")}>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Button variant="outline" className="mt-4 w-full" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>

        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-6xl">
            <span className="sr-only">{title}</span>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
