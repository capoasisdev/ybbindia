import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Layers } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { getPublicCourseOutline } from "@/lib/public.functions";

const outlineQuery = queryOptions({
  queryKey: ["public-outline"],
  queryFn: () => getPublicCourseOutline(),
});

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum | ABB Certification Programme" },
      {
        name: "description",
        content:
          "Module-by-module curriculum of the Authorised Business Broker certification programme by Yoova Business Broking.",
      },
      { property: "og:title", content: "Curriculum | ABB Certification Programme" },
      {
        property: "og:description",
        content: "Module-by-module curriculum of the ABB certification programme.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(outlineQuery),
  component: CurriculumPage,
});

function CurriculumPage() {
  const { data: outline } = useSuspenseQuery(outlineQuery);
  const modules = outline?.modules ?? [];

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="container-page py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Curriculum
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold sm:text-5xl">
            {outline?.course.title ?? "ABB Certification Programme"}
          </h1>
          {outline?.course.description && (
            <p className="mt-5 max-w-2xl text-muted-foreground">{outline.course.description}</p>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Layers className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              The curriculum is being published. Please check back shortly.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {modules.map((module, index) => (
              <li
                key={module.id}
                className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:grid-cols-[6rem_1fr]"
              >
                <div className="font-display text-3xl font-semibold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{module.title}</h2>
                  {module.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-14 rounded-3xl bg-primary px-8 py-12 text-primary-foreground">
          <h2 className="text-2xl font-semibold sm:text-3xl">Enrol and start today</h2>
          <p className="mt-3 max-w-xl text-primary-foreground/75">
            Get immediate access to every module, the workbook library and the certification
            pathway.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-7 rounded-full px-7">
            <Link to="/enrol">
              Enrol now
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
