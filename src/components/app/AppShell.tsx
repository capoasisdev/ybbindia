import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  ClipboardCheck,
  FileCheck2,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ScrollText,
  Settings2,
  UserRound,
  X,
  Eye,
  ShieldCheck,
  BookMarked,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/lib/admin.functions";
import { Wordmark } from "@/components/site/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Admin-facing sidebar nav
const ADMIN_NAV = [
  { to: "/admin/lessons", search: { tab: "lessons" }, label: "Edit Lessons", icon: BookOpen },
  { to: "/admin/lessons", search: { tab: "assignments" }, label: "Edit Assignments", icon: FileCheck2 },
  { to: "/admin/lessons", search: { tab: "questions" }, label: "Question Bank", icon: HelpCircle },
  { to: "/admin/reviews", search: {}, label: "Submission Reviews", icon: ClipboardCheck },
  { to: "/admin/certificates", search: {}, label: "Certificate Approvals", icon: ScrollText },
  { to: "/admin/pricing", search: {}, label: "Pricing Controls", icon: Settings2 },
  { to: "/profile", search: {}, label: "My Profile", icon: UserRound },
] as const;

// Student-facing sidebar nav
const STUDENT_NAV = [
  { to: "/dashboard", search: {}, label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", search: {}, label: "Lessons", icon: BookOpen },
  { to: "/resources", search: {}, label: "Resources", icon: FolderOpen },
  { to: "/assignments", search: {}, label: "Assignments", icon: FileCheck2 },
  { to: "/exam", search: {}, label: "Examination", icon: GraduationCap },
  { to: "/certificate", search: {}, label: "Certificate", icon: ScrollText },
  { to: "/profile", search: {}, label: "My Profile", icon: UserRound },
  { to: "/tickets", search: {}, label: "Support", icon: LifeBuoy },
] as const;

type ViewMode = "admin" | "student";

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "admin";
  return (localStorage.getItem("abb_view_mode") as ViewMode) ?? "admin";
}

function NavLink({
  item,
  onClick,
  mobile,
}: {
  item: { to: string; search: Record<string, string>; label: string; icon: React.ElementType };
  onClick?: () => void;
  mobile?: boolean;
}) {
  return (
    <Link
      to={item.to}
      search={item.search as any}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
        mobile
          ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
      activeProps={{
        className: mobile ? "bg-secondary text-foreground" : "bg-sidebar-accent text-sidebar-foreground",
      }}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("student");
  const [mounted, setMounted] = useState(false);

  const fetchAdminAccess = useServerFn(getAdminAccess);
  const { data: access } = useQuery({
    queryKey: ["admin-access"],
    queryFn: () => fetchAdminAccess(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isStaff = access?.isStaff || access?.isAdmin;

  // Hydrate viewMode from localStorage (only after mount to avoid SSR mismatch)
  useEffect(() => {
    if (isStaff !== undefined) {
      const stored = getStoredViewMode();
      setViewMode(isStaff ? stored : "student");
      setMounted(true);
    }
  }, [isStaff]);

  const toggleMode = () => {
    const next: ViewMode = viewMode === "admin" ? "student" : "admin";
    localStorage.setItem("abb_view_mode", next);
    setViewMode(next);
    if (next === "admin") {
      navigate({ to: "/admin/lessons" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // Pick the appropriate nav list
  const effectiveMode = !mounted || !isStaff ? "student" : viewMode;
  const nav: typeof ADMIN_NAV[number][] | typeof STUDENT_NAV[number][] =
    effectiveMode === "admin" ? (ADMIN_NAV as any) : (STUDENT_NAV as any);

  const modeToggleBtn = isStaff ? (
    <button
      onClick={toggleMode}
      className={cn(
        "mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
        effectiveMode === "admin"
          // In admin mode: subtle ghost — switching to student is a secondary action
          ? "border border-sidebar-border text-sidebar-foreground/60 hover:border-sidebar-foreground/20 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          // In student mode: solid bright — switching back to admin is a primary action
          : "bg-white/10 border border-white/20 text-white hover:bg-white/20",
      )}
    >
      {effectiveMode === "admin" ? (
        <>
          <Eye className="size-4 shrink-0" />
          Switch to Student View
        </>
      ) : (
        <>
          <ShieldCheck className="size-4 shrink-0" />
          Switch to Admin Panel
        </>
      )}
    </button>
  ) : null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-6 lg:flex">
        <Wordmark tone="light" />

        <nav className="mt-10 flex-1 space-y-1">
          {(nav as any[]).map((item) => (
            <NavLink key={`${item.to}-${item.label}`} item={item} />
          ))}
        </nav>

        <div className="space-y-1 pt-2 border-t border-sidebar-border">
          {modeToggleBtn}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
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

        {/* Mobile nav drawer */}
        <div
          className={cn(
            "border-b border-border bg-card px-5 py-4 lg:hidden",
            open ? "block" : "hidden",
          )}
        >
          <nav className="space-y-1">
            {(nav as any[]).map((item) => (
              <NavLink key={`${item.to}-${item.label}`} item={item} mobile onClick={() => setOpen(false)} />
            ))}
          </nav>
          <div className="mt-4 space-y-2">
            {isStaff && (
              <button
                onClick={() => { toggleMode(); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  effectiveMode === "admin"
                    ? "border-muted bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "border-foreground/20 bg-foreground/10 text-foreground hover:bg-foreground/20",
                )}
              >
                {effectiveMode === "admin" ? (
                  <><Eye className="size-4" /> Switch to Student View</>
                ) : (
                  <><ShieldCheck className="size-4" /> Switch to Admin Panel</>
                )}
              </button>
            )}
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Student mode banner for admins */}
        {isStaff && effectiveMode === "student" && mounted && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-700 flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5 shrink-0" />
              You are viewing the platform as a <strong>student</strong>. Changes here are real.
            </span>
            <button
              onClick={toggleMode}
              className="shrink-0 rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200 transition-colors"
            >
              Back to Admin Panel
            </button>
          </div>
        )}

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
