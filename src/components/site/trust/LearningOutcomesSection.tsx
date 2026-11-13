import { CheckCircle2 } from "lucide-react";

const OUTCOMES = [
  "Identifying saleable businesses and understanding why owners sell",
  "Managing professional relationships with business sellers",
  "Understanding buyer categories and qualification criteria",
  "Core principles and methods of business valuation",
  "Key financial concepts: EBITDA, SDE, cash flow and valuation metrics",
  "How anonymous teasers and confidential business profiles are structured",
  "Structure and terms of exclusive and non-exclusive sale mandates",
  "Strategies for managing buyer databases and referral networks",
  "Techniques for matching buyers with suitable business opportunities",
  "Handling buyer inquiries, objections and transaction negotiations",
  "Common deal structures: cash, deferred payments and earn-out mechanisms",
  "Virtual data room organisation and due diligence management",
  "Key transaction agreements: Share Purchase (SPA) and Asset Purchase (APA)",
  "Transaction closing procedures, handover protocols and fee structures",
  "Ethics, confidentiality standards and professional broking conduct",
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
            Master the Core Frameworks of Business Broking
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
