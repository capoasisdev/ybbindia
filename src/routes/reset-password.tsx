import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/site/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password | ABB Certification Programme" },
      { name: "description", content: "Choose a new password for your learner account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <Wordmark />

        <form
          className="mt-10 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (password.length < 8) {
              toast.error("Password must be at least 8 characters.");
              return;
            }
            if (password !== confirm) {
              toast.error("Passwords do not match.");
              return;
            }
            setBusy(true);
            const { error } = await supabase.auth.updateUser({ password });
            setBusy(false);
            if (error) {
              toast.error(error.message);
              return;
            }
            toast.success("Password updated.");
            navigate({ to: "/dashboard" });
          }}
        >
          <div>
            <h1 className="text-2xl font-semibold">Set a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {ready
                ? "Choose a password you haven't used before."
                : "Open this page from the reset link in your email to continue."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="h-11"
            />
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy || !ready}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
