import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  FileCheck2,
  GraduationCap,
  LifeBuoy,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getLearnerOverview } from "@/lib/learner.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | ABB Certification Programme" },
      { name: "description", content: "Your ABB certification progress, at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchOverview = useServerFn(getLearnerOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["learner-overview"],
    queryFn: () => fetchOverview({}),
  });

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const firstName = data?.profile?.full_name?.split(" ")[0] ?? "there";
  const enrolled = Boolean(data?.enrolment);
  const total = data?.lessonsTotal ?? 0;
  const completed = data?.lessonsCompleted ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Welcome, {firstName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {enrolled
              ? "Continue where you left off and keep moving towards certification."
              : "Enrol in the ABB certification programme to unlock the course."}
          </p>
        </header>

        {enrolled ? (
          <>
            <section className="rounded-2xl border border-border bg-card p-7 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Current programme
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{data?.course?.title}</h2>
                  {data?.enrolment?.valid_until && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="size-4" />
                      Access until{" "}
                      {new Date(data.enrolment.valid_until).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <Button asChild>
                  <Link to="/learn">
                    Continue learning
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Course progress</span>
                  <span className="text-muted-foreground">
                    {completed} of {total} lessons · {percent}%
                  </span>
                </div>
                <Progress value={percent} className="mt-3" />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile to="/learn" icon={BookOpen} title="Lessons" body="Watch and track your modules" />
              <Tile
                to="/assignments"
                icon={FileCheck2}
                title="Assignments"
                body="Submit work and read feedback"
              />
              <Tile
                to="/exam"
                icon={GraduationCap}
                title="Examination"
                body="Take the certification exam"
              />
              <Tile
                to="/tickets"
                icon={LifeBuoy}
                title="Support"
                body="Raise and track a ticket"
              />
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <GraduationCap className="mx-auto size-7 text-accent" />
            <h2 className="mt-4 text-xl font-semibold">You are not enrolled yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Complete your enrolment to unlock all modules, assignments, the certification
              examination and your ABB certificate.
            </p>
            <Button asChild className="mt-7 rounded-full px-7">
              <Link to="/enrol">
                Enrol now
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Tile({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: string;
  icon: typeof BookOpen;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
    >
      <Icon className="size-5 text-accent" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Open
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
