import { CheckCircle2, ClipboardList, Clock, FileCheck2, RefreshCw, Shuffle } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: ClipboardList,
    label: "Practical assignments",
    body: "Linked to each programme lesson and designed to build real-world broking capabilities.",
  },
  {
    icon: FileCheck2,
    label: "Assignment review & feedback",
    body: "Submitted assignments are reviewed. Learners receive structured feedback from the certification team.",
  },
  {
    icon: RefreshCw,
    label: "Resubmission where required",
    body: "Incomplete or insufficient submissions must be revised and resubmitted before a learner can proceed.",
  },
  {
    icon: Shuffle,
    label: "Randomised final examination",
    body: "Questions are drawn at random from the ABB question bank, ensuring no two examinations are identical.",
  },
  {
    icon: CheckCircle2,
    label: "50 questions · 60 minutes · 70% pass mark",
    body: "Learners must score at least 70% in the timed, 50-question final examination to qualify for certification.",
  },
  {
    icon: CheckCircle2,
    label: "Unique & publicly verifiable certificate",
    body: "Every successful learner receives a certificate with a unique ABB ID verifiable through the YBB website.",
  },
];

export function AssessmentCredibilitySection() {
  return (
    <section className="container-page py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Assessment Rigour
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Assessed, Not Merely Attended
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Watching the course videos alone does not automatically qualify a learner for the ABB
          credential. Learners must complete the prescribed assignments and demonstrate their
          understanding through a timed final examination.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
