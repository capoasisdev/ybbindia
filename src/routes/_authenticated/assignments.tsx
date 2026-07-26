import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments | ABB Certification Programme" },
      { name: "description", content: "Submit your assignments and read reviewer feedback." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="Assignments">
      <h1 className="text-3xl font-semibold">Assignments</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">Submit your assignments and read reviewer feedback.</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        This section becomes available as your programme content is published.
      </div>
    </AppShell>
  );
}
