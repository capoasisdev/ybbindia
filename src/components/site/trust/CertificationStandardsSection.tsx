import { Info, PlayCircle, BookOpen, Award } from "lucide-react";

const STEPS = [
  {
    icon: PlayCircle,
    title: "Complete the Video Lessons",
    body: "Study all lessons included in the 11-module ABB curriculum at your own pace.",
  },
  {
    icon: BookOpen,
    title: "Review the Deal Workbooks",
    body: "Explore the transaction frameworks, deal workbooks and financial checklists included with each module.",
  },
  {
    icon: Award,
    title: "Receive the ABB Credential",
    body: "On completing all curriculum modules, the learner receives a certificate containing a unique ABB ID that can be verified publicly.",
  },
];

export function CertificationStandardsSection() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            How Certification Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Three Steps from Enrolment to Certificate
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Complete the course and your ABB certificate is issued automatically — no exams, no submission deadlines.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
