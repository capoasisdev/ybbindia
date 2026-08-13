import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, ChevronUp, Layers, PlayCircle, BookOpen, CheckCircle2, Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          "Complete 11-module, 50-lesson curriculum of the Authorised Business Broker certification programme by Yoova Business Broking.",
      },
      { property: "og:title", content: "Curriculum | ABB Certification Programme" },
      {
        property: "og:description",
        content: "Explore all 50 practical lessons across 11 modules in the ABB certification programme.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(outlineQuery),
  component: CurriculumPage,
});

type CurriculumLesson = {
  id: string;
  position: number;
  title: string;
  lessonNumber?: number;
};

type CurriculumModule = {
  id: string;
  position: number;
  title: string;
  description?: string | null;
  lessons?: CurriculumLesson[];
};

function CurriculumPage() {
  const { data: outline } = useSuspenseQuery(outlineQuery);
  const modules: CurriculumModule[] = (outline?.modules as CurriculumModule[]) ?? [];
  const [searchQuery, setSearchQuery] = useState("");

  // Default ALL modules expanded so all 50 lessons are immediately visible
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    modules.forEach((m) => {
      initial[m.id] = true;
    });
    return initial;
  });

  const allOpen = modules.length > 0 && modules.every((m) => openMap[m.id]);

  const toggleModule = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleAll = () => {
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    modules.forEach((m) => {
      updated[m.id] = nextState;
    });
    setOpenMap(updated);
  };

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  // Filter modules/lessons based on search query
  const query = searchQuery.trim().toLowerCase();
  const filteredModules = modules.map((m) => {
    if (!query) return m;
    const moduleMatches = m.title.toLowerCase().includes(query) || (m.description ?? "").toLowerCase().includes(query);
    const matchingLessons = (m.lessons ?? []).filter(
      (l) => l.title.toLowerCase().includes(query) || `lesson ${l.lessonNumber ?? l.position}`.includes(query)
    );
    if (moduleMatches) return m;
    return { ...m, lessons: matchingLessons };
  }).filter((m) => !query || (m.lessons && m.lessons.length > 0));

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="container-page py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <BookOpen className="size-3.5" />
            Complete Programme Curriculum
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">
            {outline?.course.title ?? "ABB Certification Programme"}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            {outline?.course.description ??
              "A structured, 11-module certification covering the complete business broking lifecycle in India across 50 practical, video-linked lessons."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-foreground/80">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 border border-border shadow-xs">
              <Layers className="size-4 text-accent" />
              <strong>{modules.length}</strong> Modules
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 border border-border shadow-xs">
              <PlayCircle className="size-4 text-accent" />
              <strong>{totalLessons || 50}</strong> Practical Lessons
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 border border-border shadow-xs">
              <CheckCircle2 className="size-4 text-success" />
              Assessed Practical Workbooks
            </span>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold">Module Breakdown</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Explore all 50 practical lessons across 11 modules. Click any module to expand or collapse.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search 50 lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-lg bg-card"
              />
            </div>
            {modules.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAll}
                className="rounded-lg text-xs font-medium"
              >
                {allOpen ? (
                  <>
                    <ChevronUp className="mr-1.5 size-3.5" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1.5 size-3.5" />
                    Expand All
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {filteredModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Layers className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {searchQuery ? `No lessons match "${searchQuery}". Try a different search.` : "The curriculum is being published. Please check back shortly."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredModules.map((module, index) => {
              const isOpen = Boolean(openMap[module.id]);
              const lessons = module.lessons ?? [];

              return (
                <div
                  key={module.id}
                  className="rounded-2xl border border-border bg-card shadow-soft transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className="w-full grid gap-4 p-6 text-left sm:grid-cols-[4rem_1fr_auto] items-start hover:bg-muted/20 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="font-display text-3xl font-bold text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {lessons.length} {lessons.length === 1 ? "Lesson" : "Lessons"}
                        </span>
                      </div>
                      {module.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center justify-center size-9 rounded-full bg-secondary/60 text-muted-foreground transition-colors group-hover:bg-secondary">
                      {isOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                    </div>
                  </button>

                  {isOpen && lessons.length > 0 && (
                    <div className="border-t border-border/60 bg-muted/10 px-6 py-5 rounded-b-2xl">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Lessons in Module {index + 1}
                      </p>
                      <ul className="grid gap-2.5 sm:grid-cols-2">
                        {lessons.map((lesson: CurriculumLesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3.5 shadow-xs"
                          >
                            <PlayCircle className="mt-0.5 size-4 text-accent shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-accent">
                                Lesson {lesson.lessonNumber ?? lesson.position}
                              </p>
                              <p className="text-sm font-medium text-foreground leading-snug mt-0.5">
                                {lesson.title}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-14 rounded-3xl bg-primary px-8 py-12 text-primary-foreground">
          <h2 className="text-2xl font-semibold sm:text-3xl">Enrol and start today</h2>
          <p className="mt-3 max-w-xl text-primary-foreground/75">
            Get immediate access to all 11 modules, 50 practical lessons, the workbook library, and the certification pathway.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-7 rounded-lg px-7">
            <Link to="/enrol">
              Enroll now
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
