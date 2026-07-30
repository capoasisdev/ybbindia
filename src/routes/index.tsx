import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { getPublicCourseOutline, getPublicSettings } from "@/lib/public.functions";
import { formatPaise } from "@/domain/money";
import { readNumber, readString } from "@/domain/settings";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

const outlineQuery = queryOptions({
  queryKey: ["public-outline"],
  queryFn: () => getPublicCourseOutline(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ABB Certification Programme | Yoova Business Broking" },
      {
        name: "description",
        content:
          "Become an Authorised Business Broker. Structured video training, assessed assignments, a proctored final examination and a verifiable ABB certificate.",
      },
      { property: "og:title", content: "ABB Certification Programme | Yoova Business Broking" },
      {
        property: "og:description",
        content:
          "Structured video training, assessed assignments and a verifiable ABB credential for business broking professionals.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(outlineQuery),
    ]);
  },
  component: ProgrammePage,
});

const JOURNEY = [
  {
    icon: PlayCircle,
    title: "Learn",
    body: "Work through structured modules of professionally produced video lessons at your own pace.",
  },
  {
    icon: FileCheck2,
    title: "Apply",
    body: "Submit practical assignments that are reviewed and graded by YBB's certification reviewers.",
  },
  {
    icon: GraduationCap,
    title: "Qualify",
    body: "Clear the timed final examination drawn at random from the ABB question bank.",
  },
  {
    icon: BadgeCheck,
    title: "Get certified",
    body: "Receive your unique ABB ID and a certificate anyone can verify publicly.",
  },
];

function ProgrammePage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: outline } = useSuspenseQuery(outlineQuery);

  const pricePaise = readNumber(settings, "course_price_paise");
  const gstRate = readNumber(settings, "gst_rate_percent");
  const accessDays = readNumber(settings, "access_duration_days");
  const passPercent = readNumber(settings, "exam_pass_percent");
  const examMinutes = readNumber(settings, "exam_duration_minutes");
  const examQuestions = readNumber(settings, "exam_question_count");
  const programmeName = readString(settings, "programme_name");

  const modules = outline?.modules ?? [];

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-sidebar text-sidebar-foreground">
        <div
          aria-hidden
          className="hero-blob-a pointer-events-none absolute -right-48 -top-56 size-[42rem] rounded-full bg-accent/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="hero-blob-b pointer-events-none absolute -bottom-64 -left-40 size-[34rem] rounded-full bg-sidebar-primary/10 blur-[120px]"
        />
        <div
          aria-hidden
          className="hero-grid pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
        />

        <div className="container-page relative grid items-start gap-14 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="border-l-2 border-sidebar-primary pl-3 text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-primary">
              Yoova Business Broking · Certification
            </p>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.03] tracking-tight text-sidebar-foreground sm:text-5xl lg:text-[3.75rem]">
              Become an{" "}
              <span className="text-sidebar-primary underline decoration-sidebar-foreground decoration-2 underline-offset-[10px]">
                Authorised Business Broker
              </span>
              .
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-sidebar-foreground/75 sm:text-lg">
              The {programmeName} is YBB&apos;s end-to-end pathway for professionals who advise on
              buying and selling businesses — structured training, assessed practice and a
              credential that can be verified by anyone.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                asChild
                className="group rounded-lg bg-accent px-7 text-accent-foreground shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-lift focus-visible:ring-accent/50"
              >
                <Link to="/enrol">
                  Enroll now
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-lg border-sidebar-border bg-transparent px-7 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <Link to="/curriculum">Explore the curriculum</Link>
              </Button>
            </div>

            <dl className="mt-14 grid max-w-xl grid-cols-3 divide-x divide-sidebar-border border-t border-sidebar-border pt-8">
              {[
                { label: "Modules", value: modules.length || "—" },
                { label: "Access", value: `${accessDays} days` },
                { label: "Pass mark", value: `${passPercent}%` },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`stat-rise ${i === 0 ? "pr-6" : "px-6"}`}
                  style={{ animationDelay: `${400 + i * 120}ms` }}
                >
                  <dt className="text-xs uppercase tracking-[0.14em] text-sidebar-foreground/55">
                    {stat.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Price card */}
          <div className="lg:pl-6">
            <div className="rounded-3xl border border-sidebar-border bg-sidebar-accent/60 p-8 shadow-lift backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sidebar-primary">
                Programme fee
              </p>
              <p className="mt-4 font-display text-4xl font-semibold text-sidebar-foreground">
                {formatPaise(pricePaise)}
              </p>
              <p className="mt-1 text-sm text-sidebar-foreground/65">
                plus {gstRate}% GST · one-time payment
              </p>

              <ul className="mt-8 space-y-3.5 text-sm text-sidebar-foreground/80">
                {[
                  `${accessDays} days of full course access`,
                  "All video lessons, workbooks and templates",
                  "Reviewer-graded practical assignments",
                  `${examQuestions}-question, ${examMinutes}-minute final examination`,
                  "Unique ABB ID and publicly verifiable certificate",
                  "GST invoice issued on payment",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                asChild
                className="group mt-8 w-full rounded-lg bg-accent text-accent-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:ring-accent/50"
              >
                <Link to="/enrol">
                  Start enrollment
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-sidebar-foreground/55">
                Secure payment · GST invoice · Instant access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="container-page py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            How certification works
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Four stages from enrolment to credential
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every learner follows the same assessed pathway, so an ABB credential means the same
            thing no matter who holds it.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <step.icon className="size-5" />
                </span>
                <span className="font-display text-sm text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Curriculum preview */}
      {modules.length > 0 && (
        <section className="border-y border-border bg-secondary/50 py-20">
          <div className="container-page">
            <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Curriculum
                </p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{outline?.course.title}</h2>
                {outline?.course.subtitle && (
                  <p className="mt-4 text-muted-foreground">{outline.course.subtitle}</p>
                )}
              </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.slice(0, 5).map((module, index) => (
                <article
                  key={module.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Module {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-base font-semibold">{module.title}</h3>
                  {module.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  )}
                </article>
              ))}

              {/* 6th slot — View full curriculum CTA */}
              <Link
                to="/curriculum"
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6 shadow-soft transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover:border-accent group-hover:bg-accent/10">
                  <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
                </span>
                <p className="text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                  View full curriculum
                </p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Assurance */}
      <section className="container-page grid gap-6 py-20 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Verifiable credential",
            body: "Each certificate carries a unique ABB ID that clients and employers can verify on this site at any time.",
          },
          {
            icon: CalendarClock,
            title: "Learn on your schedule",
            body: `Progress is saved lesson by lesson, and your enrolment stays open for ${accessDays} days.`,
          },
          {
            icon: FileCheck2,
            title: "Assessed, not attended",
            body: "Assignments are reviewed by YBB and the final exam is timed and randomised for every attempt.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card p-7 shadow-soft"
          >
            <item.icon className="size-6 text-accent" />
            <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="container-page pb-8">
        <div className="overflow-hidden rounded-3xl bg-primary px-8 py-14 text-primary-foreground sm:px-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Ready to earn the ABB credential?
            </h2>
            <p className="mt-4 text-primary-foreground/75">
              Enroll today for {formatPaise(pricePaise)} plus {gstRate}% GST and get {accessDays}{" "}
              days of access to the complete programme.
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="group mt-8 rounded-lg px-7 transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/80"
            >
              <Link to="/enrol">
                Enroll now
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
