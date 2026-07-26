import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({
    meta: [
      { title: "Support | ABB Certification Programme" },
      { name: "description", content: "Raise a support ticket and track its status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="Support">
      <h1 className="text-3xl font-semibold">Support</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">Raise a support ticket and track its status.</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        This section becomes available as your programme content is published.
      </div>
    </AppShell>
  );
}
