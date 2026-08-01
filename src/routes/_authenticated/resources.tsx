import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  getLearnerResources,
  getResourceUrl,
  type LearnerResource,
} from "@/lib/resources.functions";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Resources & workbook | ABB Certification Programme" },
      {
        name: "description",
        content: "Download the ABB workbook, templates and reference material for your programme.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function Page() {
  const fetchResources = useServerFn(getLearnerResources);
  const urlFn = useServerFn(getResourceUrl);

  const { data, isLoading } = useQuery({
    queryKey: ["learner-resources"],
    queryFn: () => fetchResources({}),
  });

  const open = async (resource: LearnerResource) => {
    const { url } = await urlFn({ data: { resourceId: resource.id } });
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("That file is not available right now");
  };

  if (isLoading) {
    return (
      <AppShell title="Resources">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!data?.enrolled) {
    return (
      <AppShell title="Resources">
        <h1 className="text-3xl font-semibold">Resources &amp; workbook</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Programme material unlocks once you are enrolled.
          </p>
          <Button asChild className="mt-5">
            <Link to="/checkout">Enroll now</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const grouped = data.resources.reduce<Record<string, LearnerResource[]>>((acc, r) => {
    const key = r.moduleTitle ?? "Programme-wide";
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <AppShell title="Resources">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Resources &amp; workbook</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Templates, checklists and reference material that support each module.
          </p>
        </header>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4 shadow-soft">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Course workbook
            </p>
            <h2 className="mt-1 text-xl font-semibold">ABB Professional Workbook</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View the course workbook directly on the screen or download it for your reference.
            </p>
          </div>
          
          <Button asChild variant="outline" size="sm">
            <a href="/YBB_Workbook_Final.pdf" download="YBB_Workbook_Final.pdf" className="inline-flex items-center gap-2">
              <Download className="size-4" /> Download workbook
            </a>
          </Button>

          <div className="mt-4 rounded-xl border border-border bg-background overflow-hidden w-full h-[600px] shadow-inner">
            <iframe
              src="/YBB_Workbook_Final.pdf"
              title="ABB Workbook"
              className="w-full h-full border-0"
            />
          </div>
        </section>

        {Object.keys(grouped).length === 0 && !data.workbook ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No resources have been published yet — they appear here as each module goes live.
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <section key={group} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </h2>
              <ul className="space-y-2">
                {items.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{resource.title}</p>
                        {resource.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {resource.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[
                            resource.fileType?.toUpperCase(),
                            formatSize(resource.fileSizeBytes),
                            resource.version ? `v${resource.version}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    {resource.isDownloadable ? (
                      <Button variant="outline" size="sm" onClick={() => open(resource)}>
                        {resource.externalUrl ? (
                          <ExternalLink className="size-4" />
                        ) : (
                          <Download className="size-4" />
                        )}
                        {resource.externalUrl ? "Open" : "Download"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">View only</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
