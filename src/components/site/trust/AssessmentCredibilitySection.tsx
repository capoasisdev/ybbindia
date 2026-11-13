import { CheckCircle2, BookOpen, FileCheck2, RefreshCw } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: BookOpen,
    label: "Lesson workbooks & reference materials",
    body: "Linked to each programme lesson and designed to build real-world broking knowledge.",
  },
  {
    icon: FileCheck2,
    label: "Deal workbooks & transaction templates",
    body: "Actionable frameworks and transaction templates to apply concepts to real scenarios.",
  },
  {
    icon: RefreshCw,
    label: "Continuous revision & mastery",
    body: "Reinforce learning with structured review materials and comprehensive lesson summaries.",
  },
  {
    icon: CheckCircle2,
    label: "Unique & publicly verifiable certificate",
    body: "Every learner who completes the programme receives a certificate with a unique ABB ID verifiable through the YBB website.",
  },
];

export function AssessmentCredibilitySection() {
  return (
    <section className="container-page py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          What's Included
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Everything You Need to Learn and Get Certified
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Your enrolment gives you full access to all 50 video lessons, deal workbooks and your ABB
          certificate on completion — no exams or submission deadlines.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-lift"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold leading-snug">{item.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
