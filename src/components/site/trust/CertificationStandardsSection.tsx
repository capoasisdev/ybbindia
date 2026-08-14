import { Info, PlayCircle, FileCheck, CheckSquare, Clock, Award, ShieldCheck, ClipboardList, FileCheck2, RefreshCw, Shuffle, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: PlayCircle,
    title: "Complete the Video Lessons",
    body: "Study all lessons included in the 11-module ABB curriculum.",
  },
  {
    icon: FileCheck,
    title: "Complete the Practical Assignments",
    body: "Submit the compulsory practical assignments connected with the lessons and modules.",
  },
  {
    icon: CheckSquare,
    title: "Meet Assignment Requirements",
    body: "Assignments must meet the review requirements communicated through the learner dashboard. A learner may be asked to revise and resubmit incomplete work.",
  },
  {
    icon: Clock,
    title: "Clear the Final Examination",
    body: "Complete a 50-question, 60-minute examination randomly generated from the ABB examination question bank.",
  },
  {
    icon: Award,
    title: "Achieve the Pass Mark",
    body: "A minimum score of 70% is required to clear the final examination.",
  },
  {
    icon: ShieldCheck,
    title: "Receive the ABB Credential",
    body: "After satisfying the programme requirements, the learner receives a certificate containing a unique ABB ID that can be verified publicly.",
  },
];

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

export function CertificationStandardsSection() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Certification Standards
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            A Structured and Assessed Certification Pathway
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            The ABB credential is awarded only after the learner completes the programme
            requirements prescribed by Yoova Business Broking. Watching the course videos alone does
            not qualify a learner for certification.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="size-5" />
                </div>
                <span className="font-display text-xs font-semibold text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        {/* Assessment credibility sub-section — Assessed, Not Merely Attended */}
        <div className="mt-16 border-t border-border pt-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Assessment Credibility
            </p>
            <h3 className="mt-3 text-2xl font-semibold sm:text-3xl">
              Assessed, Not Merely Attended
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Learners must complete the prescribed assignments and demonstrate their understanding
              through a timed final examination.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-lift"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <item.icon className="size-5" />
                </div>
                <h4 className="mt-5 text-base font-semibold leading-snug">{item.label}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory Certification Disclosure Box */}
        <div className="mt-12 rounded-2xl border border-accent/40 bg-accent/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
              <Info className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Important Certification Disclosure
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                <strong>Important:</strong> The ABB Certification is a professional educational credential
                issued by Yoova Business Broking Pvt Ltd. It is not a government licence, statutory
                authorisation or regulatory approval. Certification does not guarantee employment,
                income, clients or successful transaction closures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
