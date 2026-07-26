import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/site/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password | ABB Certification Programme" },
      { name: "description", content: "Request a password reset link for your learner account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <Wordmark />

        {sent ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
            <MailCheck className="mx-auto size-6 text-success" />
            <h1 className="mt-4 text-xl font-semibold">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for {email}, we&apos;ve sent a link to reset your password.
            </p>
            <Button variant="outline" asChild className="mt-7 w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form
            className="mt-10 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              setBusy(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              setSent(true);
            }}
          >
            <div>
              <h1 className="text-2xl font-semibold">Reset your password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email address linked to your learner account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11"
              />
            </div>

            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Send reset link
            </Button>

            <Link
              to="/auth"
              className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
