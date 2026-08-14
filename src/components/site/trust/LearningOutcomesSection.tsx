import { CheckCircle2 } from "lucide-react";

const OUTCOMES = [
  "Identify potentially saleable businesses and understand why owners sell",
  "Build professional relationships with business sellers",
  "Recognise different buyer types and qualify genuine buyers",
  "Understand the fundamentals of business valuation",
  "Explain EBITDA, SDE, cash flow and common valuation approaches",
  "Prepare anonymous teasers and confidential business profiles",
  "Understand exclusive and non-exclusive sale mandates",
  "Build buyer databases and professional referral networks",
  "Match suitable buyers with relevant business opportunities",
  "Manage buyer interest, objections, offers and negotiations",
  "Understand common deal structures, including cash, deferred-payment and earn-out arrangements",
  "Organise due-diligence information and data rooms",
  "Understand the role of SPAs, APAs and transaction documents",
  "Support closing, handover and professional success-fee collection",
  "Conduct business-broking activities with confidentiality, ethics and professional discipline",
];

export function LearningOutcomesSection() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            What You Will Learn
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Build Practical Business Broking Capabilities
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            By completing the ABB Certification Programme, learners will develop a structured
            understanding of the complete business-broking journey—from identifying opportunities
            to supporting a transaction through closing.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
              <p className="text-sm font-medium leading-relaxed text-foreground/90">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
