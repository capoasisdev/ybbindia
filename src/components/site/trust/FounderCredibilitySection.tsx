import { Building, Mail, MapPin, Globe, Quote, UserCheck } from "lucide-react";

export function FounderCredibilitySection() {
  return (
    <section className="container-page py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Founder and YBB Credibility
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Built by Entrepreneurs, for Business Professionals
        </h2>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* Founder profile & quote */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold">
              KR
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Meet the Founder
              </span>
              <h3 className="text-2xl font-semibold text-foreground">Kamlesh Rohra</h3>
              <p className="text-sm text-muted-foreground">Founder, Yoova Business Broking</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Kamlesh Rohra is the Founder of Yoova Business Broking and an entrepreneur with
              experience in building and managing businesses across education, food services and
              business advisory.
            </p>
            <p>
              He created YBB with the objective of developing a more structured, ethical and
              professional ecosystem for business broking in India.
            </p>
            <p>
              The ABB Certification Programme brings together essential concepts relating to
              sellers, buyers, valuation, mandates, confidentiality, negotiation, due diligence and
              transaction execution into one practical learning pathway.
            </p>
          </div>

          {/* Founder Quote */}
          <div className="mt-8 rounded-xl border border-accent/30 bg-accent/10 p-6">
            <Quote className="size-6 text-accent mb-2" />
            <blockquote className="text-sm font-medium italic text-foreground leading-relaxed">
              &ldquo;Business broking requires more than introductions. It requires trust,
              confidentiality, commercial understanding and the ability to manage both buyers and
              sellers professionally.&rdquo;
            </blockquote>
            <p className="mt-3 text-xs font-semibold text-accent-foreground">
              — Kamlesh Rohra, Founder, Yoova Business Broking
            </p>
          </div>
        </div>

        {/* About Yoova Business Broking & Legal Identity Block */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h3 className="font-display text-xl font-semibold text-foreground">
              About Yoova Business Broking
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Yoova Business Broking is building a professional ecosystem for business broking
              education, buyer-seller connectivity and transaction support in India.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Through the ABB Certification Programme, YBB aims to help aspiring and existing
              professionals understand the structured processes, ethical standards and practical
              responsibilities involved in business-sale transactions.
            </p>
          </div>

          {/* Legal identity details block */}
          <div className="rounded-2xl border border-border/80 bg-secondary/50 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building className="size-4 text-accent" />
              <span>Legal Entity & Provider Details</span>
            </div>

            <dl className="mt-4 space-y-3.5 text-xs">
              <div>
                <dt className="text-muted-foreground">Programme & Certification Provider:</dt>
                <dd className="font-semibold text-foreground">Yoova Business Broking Pvt Ltd</dd>
              </div>

              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-accent" /> Registered / Business Address:
                </dt>
                <dd className="mt-0.5 text-foreground leading-relaxed">
                  E503, Samraat Tropicano, Serene Meadows, Gangapur Road, Nashik – 422013, Maharashtra, India
                </dd>
              </div>

              <div className="flex justify-between border-t border-border pt-3">
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3 text-accent" /> Email:
                  </dt>
                  <dd className="font-medium text-foreground">info@ybbindia.com</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Globe className="size-3 text-accent" /> Website:
                  </dt>
                  <dd className="font-medium text-foreground">www.ybbindia.com</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
