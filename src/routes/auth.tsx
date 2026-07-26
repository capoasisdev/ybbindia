import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Wordmark } from "@/components/site/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in | ABB Certification Programme" },
      {
        name: "description",
        content: "Sign in or create your Yoova Business Broking learner account.",
      },
      { property: "og:title", content: "Sign in | ABB Certification Programme" },
      { property: "og:description", content: "Access your ABB certification dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

/** Only same-origin relative paths are accepted as a post-auth destination. */
function safeRedirect(value: string | undefined): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const redirectTo = safeRedirect(search.redirect);
  const [tab, setTab] = useState<"signin" | "signup">(search.mode ?? "signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.assign(redirectTo);
    });
  }, [redirectTo]);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 size-[30rem] rounded-full bg-accent/15 blur-3xl"
        />
        <Wordmark tone="light" />
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Your pathway to the ABB credential.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-sidebar-foreground/70">
            Sign in to continue your lessons, submit assignments, take the certification
            examination and download your certificate.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Yoova Business Broking
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Wordmark />
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as "signin" | "signup")} className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-8">
              <SignInForm redirectTo={redirectTo} onDone={() => navigate({ to: redirectTo })} />
            </TabsContent>
            <TabsContent value="signup" className="mt-8">
              <SignUpForm redirectTo={redirectTo} onSignedIn={() => navigate({ to: redirectTo })} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function GoogleButton({ redirectTo }: { redirectTo: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            sessionStorage.setItem("ybb:post_auth_redirect", redirectTo);
          } catch {
            /* storage may be unavailable */
          }
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          if (result.error) {
            setBusy(false);
            toast.error("Google sign-in failed. Please try again.");
            return;
          }
          if (result.redirected) return;
          window.location.assign(redirectTo);
        }}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.46a5.5 5.5 0 0 1-2.4 3.6v3h3.88c2.27-2.09 3.58-5.17 3.58-8.71z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.26a12 12 0 0 0 0 10.74l4.01-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4.01 3.09C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

function SignInForm({ redirectTo, onDone }: { redirectTo: string; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) {
          toast.error(
            error.message === "Invalid login credentials"
              ? "Email or password is incorrect."
              : error.message,
          );
          return;
        }
        toast.success("Welcome back.");
        onDone();
      }}
    >
      <GoogleButton redirectTo={redirectTo} />

      <div className="space-y-2">
        <Label htmlFor="signin-email">Email address</Label>
        <Input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Password</Label>
          <Link to="/forgot-password" className="text-xs font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="signin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11"
        />
      </div>

      <Button type="submit" className="h-11 w-full" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function SignUpForm({ redirectTo, onSignedIn }: { redirectTo: string; onSignedIn: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters.");
          return;
        }
        setBusy(true);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
            data: { full_name: fullName, mobile },
          },
        });
        setBusy(false);
        if (error) {
          toast.error(
            error.message.toLowerCase().includes("already")
              ? "An account with this email already exists. Please sign in."
              : error.message,
          );
          return;
        }
        if (data.session) {
          toast.success("Account created.");
          onSignedIn();
          return;
        }
        toast.success("Check your inbox to confirm your email address.");
      }}
    >
      <GoogleButton redirectTo={redirectTo} />

      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-mobile">Mobile number</Label>
        <Input
          id="signup-mobile"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
          placeholder="+91 98765 43210"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link to="/legal/$slug" params={{ slug: "terms" }} className="text-accent hover:underline">
          terms of use
        </Link>{" "}
        and{" "}
        <Link to="/legal/$slug" params={{ slug: "privacy" }} className="text-accent hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
