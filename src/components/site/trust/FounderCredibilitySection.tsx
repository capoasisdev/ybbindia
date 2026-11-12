import {
  Building,
  Mail,
  MapPin,
  Globe,
  TrendingUp,
  Handshake,
  Rocket,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function FounderCredibilitySection({ companyCin }: { companyCin?: string }) {
  return (
    <section className="container-page py-20">
      {/* Section Header */}
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Meet the Founder
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl text-foreground font-display">
          Built on 20+ Years of Deal-Making
        </h2>
      </div>

      {/* Main Instructor Profile Container */}
      <div className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft">
        <div className="grid gap-10 lg:grid-cols-[340px_1fr] items-start">
          {/* Left Column: Portrait & Identity */}
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-secondary/30 shadow-md">
              <img
                src="/instructor.jpeg"
                alt="Kamlesh Rohra — Founder, Yoova Business Broking"
                className="w-full h-auto object-cover object-top aspect-[4/5]"
                loading="lazy"
              />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-card/90 backdrop-blur-md px-3.5 py-2.5 border border-border/60 flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent shrink-0" />
                <span className="text-xs font-medium text-foreground">
                  Founder &amp; Programme Designer
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-display text-foreground">Kamlesh Rohra</h3>
              <p className="text-sm font-semibold text-accent">Founder, Yoova Business Broking</p>
            </div>

            {/* Credential pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <TrendingUp className="size-3 text-accent" /> 20+ Years Financial Markets
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <Handshake className="size-3 text-accent" /> M&amp;A &amp; Deal Sourcing
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <Rocket className="size-3 text-accent" /> Venture Founder
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <BookOpen className="size-3 text-accent" /> Published Author
              </span>
            </div>

            {/* Founder Expectation Quote Card */}
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                <Sparkles className="size-3.5" />
                <span>How This Programme Was Built</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground italic">
                &ldquo;Kamlesh designed this programme around the way deals actually happen, not
                just how textbooks describe them. Expect practical frameworks, real-world scenarios
                and honest lessons about what goes right and wrong in a transaction, drawn from
                twenty years of sitting across the table from investors, buyers, sellers and
                advisors.&rdquo;
              </p>
            </div>
          </div>

          {/* Right Column: In-Depth Biography & Experience Cards */}
          <div className="space-y-8">
            {/* Lead Bio Paragraph */}
            <div className="rounded-2xl bg-secondary/40 p-6 border border-border/60">
              <p className="text-base sm:text-lg leading-relaxed text-foreground font-medium">
                Kamlesh Rohra has spent more than two decades on both sides of the business table: advising
                investors, negotiating transactions and building companies of his own. This programme
                brings together what he has learned from all three.
              </p>
            </div>

            {/* 4 Track-Record Pillars */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Pillar 1 */}
              <div className="rounded-2xl border border-border bg-background p-6 space-y-3 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                    <TrendingUp className="size-4" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground font-display">
                    Two Decades in Financial Markets
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Kamlesh began his career in 2005 as a sales executive at India Infoline, where his
                  results quickly earned him the role of branch manager. He went on to HSBC
                  InvestDirect, rising through branch leadership to become Vice President and Head of the
                  Private Client Group, managing wealth relationships with ultra-high-net-worth clients
                  in South Mumbai. Those years taught him how serious investors think, what earns their
                  trust, and how decisions involving large sums of money are really made.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="rounded-2xl border border-border bg-background p-6 space-y-3 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                    <Handshake className="size-4" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground font-display">
                    From Advisory to Deal-Making
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  As CEO of a broking firm within a diversified financial group, Kamlesh played a pivotal
                  role in acquiring listed companies, coordinating due diligence and leading negotiations.
                  He worked on a reverse merger, took a logistics company public through a merchant
                  banker, and led the conversion of around ₹300 crore of unstructured debt into equity,
                  structuring a solution that worked for both the company and its investors. He also
                  negotiated the acquisition of a quick-service food brand through a slump sale and
                  served as its interim CEO.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="rounded-2xl border border-border bg-background p-6 space-y-3 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                    <Rocket className="size-4" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground font-display">
                    Building Businesses from the Ground Up
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  As an entrepreneur, Kamlesh co-founded SaladO, building it from a home kitchen into one
                  of India’s most recognised salad brands, with 50+ kitchens through a franchise model,
                  and raising equity funding along the way. He also founded CapOasis Technology, an IT
                  company focused on AI. Building his own ventures, through successes and setbacks, gave
                  him a first-hand understanding of what business owners go through, which is invaluable
                  when helping them sell, buy or bring in partners.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="rounded-2xl border border-border bg-background p-6 space-y-3 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                    <BookOpen className="size-4" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground font-display">
                    Published Author
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Kamlesh is the author of two published books:{" "}
                  <span className="font-medium text-foreground italic">
                    Unforced: The Myth of Discipline – The Power of Flow
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-foreground italic">
                    The Psychology of the Middle Class
                  </span>
                  , exploring how people really work, make high-stakes decisions and build sustainable
                  wealth.
                </p>
              </div>
            </div>

            {/* Why He Created This Programme */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                <Building className="size-4" />
                <span>The Vision Behind Yoova Business Broking</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground font-display">
                Why He Created This Programme
              </h4>
              <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
                <p>
                  In the West, business broking is a full-fledged industry. Business brokers are trained
                  professionals with recognised certifications, professional associations and established
                  standards, and they help thousands of small and mid-sized businesses change hands every
                  year through a structured, confidential process.
                </p>
                <p>
                  In India, the opportunity is just as large, but the industry barely exists in organised
                  form. Across his career, Kamlesh saw the same pattern again and again: good SME
                  businesses ready for a sale, a partner or fresh capital, yet deals happening only
                  through informal channels, depending on who happens to know whom, without structure,
                  confidentiality or professional standards. Valuable businesses go unsold, buyers never
                  find the right opportunities, and the professionals who could bring them together have no
                  framework to work within.
                </p>
                <p className="font-medium text-foreground">
                  Kamlesh founded Yoova Business Broking with one clear mission: to bring structure to
                  business broking in India, and to build the country’s first structured business broking
                  company. This certification programme is the foundation of that mission, training
                  professionals to approach business broking with the knowledge, discipline and ethics
                  the work deserves.
                </p>
              </div>

              {/* Next Step Marketplace Callout */}
              <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                    <CheckCircle2 className="size-3.5" />
                    <span>The Next Step: businessbroking.in</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                    A verified marketplace where certified business brokers and professionals such as
                    CAs, CSs, lawyers, bankers and wealth managers collaborate on genuine deals. Learners
                    who complete this programme will be eligible to apply.
                  </p>
                </div>
                <a
                  href="https://businessbroking.in"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span>Visit businessbroking.in</span>
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Identity & Provider Details Block */}
      <div className="mt-10 rounded-2xl border border-border/80 bg-secondary/40 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Building className="size-4 text-accent" />
          <span>Legal Entity &amp; Provider Details</span>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 text-xs">
          <div>
            <p className="text-muted-foreground">Programme &amp; Certification Provider:</p>
            <p className="mt-1 font-semibold text-sm text-foreground">Yoova Business Broking Pvt Ltd</p>
            {companyCin && (
              <p className="mt-1.5 font-mono text-xs text-foreground/90">CIN: {companyCin}</p>
            )}
            <p className="mt-3 text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-accent shrink-0" /> Registered / Business Address:
            </p>
            <p className="mt-1 text-foreground leading-relaxed">
              E503, Samraat Tropicano, Serene Meadows, Gangapur Road, Nashik – 422013, Maharashtra, India
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="size-3.5 text-accent" /> Official Support Email:
              </p>
              <a
                href="mailto:info@ybbindia.com"
                className="mt-1 font-medium text-foreground underline block"
              >
                info@ybbindia.com
              </a>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Globe className="size-3.5 text-accent" /> Official Website:
              </p>
              <a
                href="https://www.ybbindia.com"
                target="_blank"
                rel="noreferrer"
                className="mt-1 font-medium text-foreground underline block"
              >
                www.ybbindia.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
