import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CheckCircle2, CirclePlay, Lock, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCourseOutline } from "@/lib/learn.functions";

const outlineQuery = queryOptions({
  queryKey: ["course-outline"],
  queryFn: () => getCourseOutline(),
});

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({
    meta: [
      { title: "Lessons | ABB Certification Programme" },
      { name: "description", content: "Watch your ABB course lessons and track completion." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(outlineQuery),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(outlineQuery);
  const percent = data.lessonsTotal
    ? Math.round((data.lessonsCompleted / data.lessonsTotal) * 100)
    : 0;

  return (
    <AppShell title="Lessons">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="border-l-2 border-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Course player
          </p>
          <h1 className="mt-3 text-3xl font-semibold">{data.courseTitle ?? "Lessons"}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {data.enrolled
              ? `${data.lessonsCompleted} of ${data.lessonsTotal} lessons complete.${data.sequential ? " Lessons unlock in order." : ""}`
              : "Enrol in the programme to unlock the lessons."}
          </p>
        </div>
        {data.enrolled && data.nextLessonId ? (
          <Button asChild>
            <Link to="/learn/$lessonId" params={{ lessonId: data.nextLessonId }}>
              <CirclePlay className="size-4" />
              Continue learning
            </Link>
          </Button>
        ) : null}
      </div>

      {!data.enrolled && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-semibold text-foreground">Curriculum Preview Mode</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unlock all modules, video lessons, resources, and the certification exam by enrolling.
            </p>
          </div>
          <Button asChild className="shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
            <Link to="/checkout">Enroll in Programme</Link>
          </Button>
        </div>
      )}

      {data.enrolled && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Programme progress</span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="mt-3" />
        </div>
      )}

      <div className="mt-8 space-y-5">
        {data.modules.map((module) => (
          <section key={module.id} className="rounded-2xl border border-border bg-card">
            <header className="border-b border-border px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Module {module.position}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{module.title}</h2>
              {module.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
              ) : null}
            </header>
            <ul className="divide-y divide-border">
              {module.lessons.length === 0 ? (
                <li className="px-6 py-5 text-sm text-muted-foreground">
                  Lessons for this module are being published.
                </li>
              ) : (
                module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    {lesson.isLocked ? (
                      <div className="flex items-center gap-3 px-6 py-4 text-sm text-muted-foreground">
                        <Lock className="size-4 shrink-0" />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-xs">Locked</span>
                      </div>
                    ) : (
                      <Link
                        to="/learn/$lessonId"
                        params={{ lessonId: lesson.id }}
                        className="flex items-center gap-3 px-6 py-4 text-sm transition-colors hover:bg-secondary"
                      >
                        {lesson.isComplete ? (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        ) : (
                          <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 font-medium">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {lesson.isComplete ? "Complete" : `${lesson.watchPercent}%`}
                        </span>
                      </Link>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
