import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  GraduationCap,
  Info,
  PlayCircle,
  Sparkles,
} from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getFreePreviewLesson,
  getPublicCourseOutline,
  getPublicPilotStats,
  getPublicSettings,
} from "@/lib/public.functions";
import { formatPaise } from "@/domain/money";
import { readNumber, readString } from "@/domain/settings";
import { trackViewContent } from "@/lib/meta-pixel";

import { AudienceSection } from "@/components/site/trust/AudienceSection";
import { LearningOutcomesSection } from "@/components/site/trust/LearningOutcomesSection";
import { WhyYbbSection } from "@/components/site/trust/WhyYbbSection";
import { CertificationStandardsSection } from "@/components/site/trust/CertificationStandardsSection";
import { WorkbookPreviewSection } from "@/components/site/trust/WorkbookPreviewSection";
import { CertificatePreviewSection } from "@/components/site/trust/CertificatePreviewSection";
import { FounderCredibilitySection } from "@/components/site/trust/FounderCredibilitySection";
import { FaqSection } from "@/components/site/trust/FaqSection";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

const outlineQuery = queryOptions({
  queryKey: ["public-outline"],
  queryFn: () => getPublicCourseOutline(),
});

const pilotStatsQuery = queryOptions({
  queryKey: ["public-pilot-stats"],
  queryFn: () => getPublicPilotStats(),
});

const previewLessonQuery = queryOptions({
  queryKey: ["free-preview-lesson"],
  queryFn: () => getFreePreviewLesson(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ABB Certification Programme | Yoova Business Broking" },
      {
        name: "description",
        content:
          "Become an Authorised Business Broker. Structured video training, deal workbooks, a timed and randomised final examination and a verifiable ABB certificate.",
      },
      { property: "og:title", content: "ABB Certification Programme | Yoova Business Broking" },
      {
        property: "og:description",
        content:
          "Structured video training, deal workbooks and a verifiable ABB credential for business broking professionals.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(outlineQuery),
      context.queryClient.ensureQueryData(pilotStatsQuery),
      context.queryClient.ensureQueryData(previewLessonQuery),
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
    title: "Study",
    body: "Study transaction frameworks, deal workbooks and case material connected to each module.",
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
  const { data: pilotStats } = useSuspenseQuery(pilotStatsQuery);
  const { data: previewLesson } = useSuspenseQuery(previewLessonQuery);
  const [previewOpen, setPreviewOpen] = useState(false);

  const pricePaise = readNumber(settings, "course_price_paise");
  const accessDays = readNumber(settings, "access_duration_days");
  const passPercent = readNumber(settings, "exam_pass_percent");
  const examMinutes = readNumber(settings, "exam_duration_minutes");
  const examQuestions = readNumber(settings, "exam_question_count");
  const programmeName = readString(settings, "programme_name");
  const companyCin = readString(settings, "company_cin").trim();

  useEffect(() => {
    trackViewContent({
      contentName: programmeName || "ABB Certification Programme",
      value: pricePaise / 100,
      currency: "INR",
    });
  }, [programmeName, pricePaise]);

  const paidCount = pilotStats?.paidEnrolmentsCount;
  const pilotCap = pilotStats?.pilotCap ?? 100;
  const seatsRemaining = typeof paidCount === "number" ? Math.max(0, pilotCap - paidCount) : null;

  const modules = outline?.modules ?? [];

  return (
    <SiteLayout>
      {/* Pilot Announcement Banner at Top of Homepage */}
      <aside
        aria-label="Pilot cohort offer"
        className="border-b border-accent/40 bg-accent/15 px-4 py-2.5 text-center text-xs font-medium text-foreground sm:text-sm"
      >
        <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="font-semibold text-accent">Pilot offer:</span>
          <span>
            ₹1,999 for the first 100 learners. Fee becomes ₹4,999 after that. Pilot learners also get
            a 15-minute 1:1 call with the founder.
          </span>
          {typeof paidCount === "number" && seatsRemaining !== null && (
            <span className="inline-flex items-center rounded-full bg-accent/25 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
              {paidCount} / {pilotCap} claimed · {seatsRemaining} remaining
            </span>
          )}
        </div>
      </aside>

      {/* 1 & 2. Hero & Programme Fee & Statistics */}
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
              The {programmeName} is YBB&apos;s end-to-end pathway for anyone who wants to learn how
              businesses are bought and sold — structured training, deal workbooks and a
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
                { label: "Modules", value: modules.length || "11" },
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
              <p className="mt-3 font-display text-4xl font-semibold text-sidebar-foreground">
                {formatPaise(pricePaise)}
              </p>
              <p className="mt-1 text-sm text-sidebar-foreground/65">
                one-time payment
              </p>

              <ul className="mt-7 space-y-3.5 text-sm text-sidebar-foreground/80">
                {[
                  `${accessDays} days of full course access`,
                  "All 50 video lessons, deal workbooks and templates",
                  "Course language: English",
                  `${examQuestions}-question, ${examMinutes}-minute final examination`,
                  "Unique ABB ID and publicly verifiable certificate",
                  "Payment receipt issued on payment",
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
                Secure payment · Payment receipt · Instant access
              </p>
            </div>
            <p className="mt-3 px-2 text-center text-[11px] leading-relaxed text-sidebar-foreground/65">
              Private educational certification by Yoova Business Broking Pvt Ltd. Not a government
              licence or regulatory approval. No guarantee of income or clients.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How certification works */}
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

      {/* 4. Who the programme is for */}
      <AudienceSection />

      {/* 5. What learners will learn */}
      <LearningOutcomesSection />

      {/* 6. Why choose YBB */}
      <WhyYbbSection />

      {/* 7. Curriculum preview */}
      {modules.length > 0 && (
        <section className="border-y border-border bg-secondary/50 py-20">
          <div className="container-page">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Curriculum
                </p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{outline?.course.title}</h2>
                {outline?.course.subtitle && (
                  <p className="mt-4 text-muted-foreground">{outline.course.subtitle}</p>
                )}
              </div>
              {previewLesson && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setPreviewOpen(true)}
                  className="shrink-0 gap-2 rounded-lg border-accent/40 bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <PlayCircle className="size-4 text-accent" />
                  Watch Lesson 1 Free Preview
                </Button>
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

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-accent" />
              <p>
                Video lessons are presented by AI-generated presenters. All course content,
                frameworks and case material are designed by Kamlesh Rohra, drawing on 20+ years of
                deal-making experience.
              </p>
            </div>
          </div>
        </section>
      )}

      {previewLesson && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                Free Lesson Preview — {previewLesson.title}
              </DialogTitle>
              <DialogDescription>
                Sample lesson from Module 1 of the Authorised Business Broker (ABB) Certification
                Programme. Video lessons are presented by AI-generated presenters; all course
                content is designed by Kamlesh Rohra.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-black">
              <video
                src={previewLesson.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 8. Certification standards */}
      <CertificationStandardsSection />

      {/* 9. Workbook preview */}
      <WorkbookPreviewSection />

      {/* 10. Sample certificate and public verification */}
      <CertificatePreviewSection />

      {/* 11. Founder and YBB credibility */}
      <FounderCredibilitySection companyCin={companyCin} />

      {/* 12. Learner Testimonials (Intentionally omitted until real cohort results are available) */}

      {/* 13. Frequently asked questions */}
      <FaqSection />

      {/* 14. Final enrolment call-to-action */}
      <section className="container-page py-16">
        <div className="overflow-hidden rounded-3xl bg-primary px-8 py-14 text-primary-foreground sm:px-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Ready to earn the ABB credential?
            </h2>
            <p className="mt-4 text-primary-foreground/75">
              Enroll today for {formatPaise(pricePaise)} and get {accessDays}{" "}
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

