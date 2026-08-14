import {
  Briefcase,
  Building2,
  Calculator,
  Scale,
  Users,
  TrendingUp,
} from "lucide-react";

const AUDIENCES = [
  {
    icon: Briefcase,
    title: "Aspiring Business Brokers",
    body: "For individuals who want to build a professional career or independent practice in business broking.",
  },
  {
    icon: Building2,
    title: "Entrepreneurs and Business Owners",
    body: "For founders who want to understand business valuation, sale readiness, buyer expectations and transaction processes.",
  },
  {
    icon: Calculator,
    title: "Chartered Accountants and Financial Professionals",
    body: "For professionals who already advise business owners and want to expand their understanding of business-sale transactions.",
  },
  {
    icon: Scale,
    title: "Lawyers and Compliance Professionals",
    body: "For professionals who want greater commercial understanding of mandates, confidentiality, due diligence and transaction execution.",
  },
  {
    icon: Users,
    title: "Business Consultants",
    body: "For consultants who want to add business-sale advisory and buyer-seller facilitation to their professional services.",
  },
  {
    icon: TrendingUp,
    title: "Wealth Managers and Investment Professionals",
    body: "For professionals who work with HNIs, investors, family offices or business owners looking for acquisition and investment opportunities.",
  },
];

export function AudienceSection() {
  return (
    <section className="container-page py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Who Is This Programme For?
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Designed for Professionals Who Want to Enter Business Broking
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The ABB Certification Programme is designed for professionals who want a structured
          understanding of how businesses are identified, prepared, positioned and supported
          through a sale or acquisition process.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.map((item) => (
          <article
            key={item.title}
            className="group rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-accent/15 group-hover:text-accent">
              <item.icon className="size-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold leading-snug">{item.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border/80 bg-secondary/40 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No previous business-broking experience is required. The programme begins with the
          fundamentals and progresses through practical transaction concepts.
        </p>
      </div>
    </section>
  );
}
