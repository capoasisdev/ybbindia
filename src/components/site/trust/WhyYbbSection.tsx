import { BookOpen, FileCheck2, Award, ShieldCheck } from "lucide-react";

const PILLARS = [
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    body: "A complete 11-module learning pathway covering the foundations, processes, ethics and practical responsibilities of business broking.",
  },
  {
    icon: FileCheck2,
    title: "Practical Application",
    body: "Every lesson is supported by a practical assignment designed to help learners apply the concepts to realistic business-broking situations.",
  },
  {
    icon: Award,
    title: "Assessed Certification",
    body: "The ABB credential is not issued merely for watching videos. Learners must complete the prescribed assignments and clear the final examination.",
  },
  {
    icon: ShieldCheck,
    title: "Public Verification",
    body: "Every successful learner receives a unique ABB ID. Clients, employers and professional contacts can verify the certificate directly through the YBB website.",
  },
];

export function WhyYbbSection() {
  return (
    <section className="container-page py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Why Choose YBB?
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">More Than Video Lessons</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The ABB programme combines structured learning, practical application, formal
          assessment and public certificate verification. Learners must demonstrate participation
          and understanding before receiving the ABB credential.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <pillar.icon className="size-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{pillar.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
