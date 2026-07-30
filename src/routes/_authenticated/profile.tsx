import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile | ABB Certification Programme" },
      { name: "description", content: "Manage your personal, billing and certificate details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="My profile">
      <h1 className="text-3xl font-semibold">My profile</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Manage your personal, billing and certificate details.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        This section becomes available as your programme content is published.
      </div>
    </AppShell>
  );
}
