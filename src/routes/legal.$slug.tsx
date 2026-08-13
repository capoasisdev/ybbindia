import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Shield, FileText, Scale, Mail, MapPin, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { getLegalDocument } from "@/lib/public.functions";

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    const doc = await getLegalDocument({ data: { slug: params.slug } });
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Document unavailable | Yoova Business Broking" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} | Yoova Business Broking Legal`;
    const description = `${loaderData.title} (version ${loaderData.version}) for the Authorised Business Broker (ABB) certification programme. Effective ${loaderData.effective_date}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: LegalPage,
  notFoundComponent: LegalNotFound,
  errorComponent: LegalNotFound,
});

const LEGAL_DOCS = [
  { slug: "terms", title: "Terms of Use", desc: "Governs platform access, course usage and terms" },
  { slug: "privacy", title: "Privacy Policy", desc: "How we collect, handle and protect your personal data" },
  { slug: "refund", title: "Refund Policy", desc: "Order access rules and payment issue handling" },
];

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderContentLines(text: string) {
  if (!text) return null;
  const subBlocks = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return subBlocks.map((sub, sIdx) => {
    const lines = sub.split("\n").map((l) => l.trim()).filter(Boolean);
    const isBulletList = lines.length > 0 && lines.every((line) => line.startsWith("- ") || line.startsWith("• "));

    if (isBulletList) {
      return (
        <div key={sIdx} className="my-3 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-xs">
          <ul className="space-y-3 text-sm text-foreground/90">
            {lines.map((line, lIdx) => (
              <li key={lIdx} className="flex items-start gap-3 leading-relaxed">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>{renderFormattedText(line.replace(/^[-•]\s*/, ""))}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p key={sIdx} className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line my-3">
        {renderFormattedText(sub)}
      </p>
    );
  });
}

function LegalPage() {
  const doc = Route.useLoaderData();

  const blocks = String(doc.body)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  // Extract sections for quick index navigation
  const sections = blocks
    .filter((b) => b.startsWith("### "))
    .map((b) => {
      const firstLine = b.split("\n")[0];
      const heading = firstLine.replace(/^###\s+/, "");
      const match = heading.match(/^(\d+)\.\s+(.*)/);
      return {
        num: match ? match[1] : "",
        title: match ? match[2] : heading,
        id: `section-${match ? match[1] : heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        fullTitle: heading,
      };
    });

  return (
    <SiteLayout>
      {/* Header Banner */}
      <header className="border-b border-border bg-gradient-to-b from-secondary/60 via-secondary/30 to-background py-14">
        <div className="container-page max-w-6xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <Scale className="size-3.5" />
              Yoova Business Broking · Official Legal Governance
            </div>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-display">
            {doc.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1 border border-border font-medium text-foreground">
              <FileText className="size-3.5 text-accent" />
              Version {doc.version}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1 border border-border font-medium text-foreground">
              <CheckCircle2 className="size-3.5 text-success" />
              Effective Date:{" "}
              {new Date(doc.effective_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1 border border-border font-medium text-foreground">
              <Shield className="size-3.5 text-accent" />
              Exclusive Jurisdiction: Nashik, Maharashtra
            </span>
          </div>

          {/* Quick Document Navigation Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border/70 pt-6">
            {LEGAL_DOCS.map((item) => {
              const active = item.slug === doc.slug;
              return (
                <Link
                  key={item.slug}
                  to="/legal/$slug"
                  params={{ slug: item.slug }}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card hover:bg-muted text-muted-foreground border border-border/80 hover:text-foreground"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <section className="container-page max-w-6xl py-14">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
          {/* Sticky Left Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {/* Document Switcher Card */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Legal Index
                </p>
                <nav className="space-y-1">
                  {LEGAL_DOCS.map((item) => {
                    const active = item.slug === doc.slug;
                    return (
                      <Link
                        key={item.slug}
                        to="/legal/$slug"
                        params={{ slug: item.slug }}
                        className={`group flex items-start gap-2.5 rounded-xl p-2.5 text-xs transition-all ${
                          active
                            ? "bg-accent/10 font-semibold text-accent border border-accent/20"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <FileText className={`mt-0.5 size-4 shrink-0 ${active ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <div>
                          <p className="leading-snug">{item.title}</p>
                          <p className="text-[11px] font-normal text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Section Jump Nav */}
              {sections.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    On This Page
                  </p>
                  <nav className="max-h-[340px] overflow-y-auto space-y-1 pr-1 text-xs">
                    {sections.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="block rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors truncate"
                      >
                        {sec.num ? `${sec.num}. ` : ""}{sec.title}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Legal Support Box */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs text-xs space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Mail className="size-4 text-accent" />
                  Legal Assistance
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  For formal inquiries regarding our legal policies or governance, contact our legal desk.
                </p>
                <a
                  href="mailto:info@ybbindia.com"
                  className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                >
                  info@ybbindia.com
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>
          </aside>

          {/* Document Content Column */}
          <main className="min-w-0 space-y-8">
            {blocks.map((block, index) => {
              // Section Header & Body
              if (block.startsWith("### ")) {
                const lines = block.split("\n");
                const headerLine = lines[0];
                const bodyText = lines.slice(1).join("\n").trim();

                const heading = headerLine.replace(/^###\s+/, "");
                const match = heading.match(/^(\d+)\.\s+(.*)/);
                const secNum = match ? match[1] : "";
                const secTitle = match ? match[2] : heading;
                const secId = `section-${secNum || heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

                return (
                  <div key={index} id={secId} className="pt-6 scroll-mt-28 space-y-4">
                    <div className="flex items-center gap-3 border-b border-border/80 pb-3">
                      {secNum && (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-display text-sm font-bold text-accent">
                          {secNum.padStart(2, "0")}
                        </span>
                      )}
                      <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
                        {secTitle}
                      </h2>
                    </div>

                    {bodyText ? (
                      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs space-y-2">
                        {renderContentLines(bodyText)}
                      </div>
                    ) : null}
                  </div>
                );
              }

              // Document Title Header in Body
              if (block.startsWith("# ")) {
                return (
                  <div key={index} className="rounded-2xl border border-accent/20 bg-accent/5 p-6 my-4">
                    <h2 className="text-2xl font-bold text-foreground font-display">
                      {block.replace(/^#\s+/, "")}
                    </h2>
                  </div>
                );
              }

              // Standalone Bullet List or Paragraph
              return (
                <div key={index} className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
                  {renderContentLines(block)}
                </div>
              );
            })}

            {/* Official Entity & Contact Footer Card */}
            <div className="mt-14 rounded-3xl border border-border bg-sidebar p-8 text-sidebar-foreground shadow-lift">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-1 text-xs font-semibold text-sidebar-primary">
                    <Scale className="size-3.5" />
                    Yoova Business Broking Pvt Ltd
                  </div>
                  <h3 className="text-lg font-semibold text-sidebar-foreground font-display">
                    Legal & Corporate Contact
                  </h3>
                  <div className="space-y-1 text-xs text-sidebar-foreground/75 leading-relaxed">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-sidebar-primary" />
                      <span>E503, Samraat Tropicano, Serene Meadows, Gangapur Road, Nashik – 422013, Maharashtra, India</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-3.5 shrink-0 text-sidebar-primary" />
                      <span>info@ybbindia.com</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 space-y-2">
                  <Button size="sm" asChild className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
                    <a href="mailto:info@ybbindia.com">
                      Contact Legal Team
                      <ExternalLink className="ml-1.5 size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>
    </SiteLayout>
  );
}

function LegalNotFound() {
  return (
    <SiteLayout>
      <div className="container-page max-w-2xl py-24 text-center">
        <h1 className="text-3xl font-semibold">Document not available</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This policy has not been published yet. Please contact support if you need a copy.
        </p>
        <Link
          to="/support"
          className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Contact support
        </Link>
      </div>
    </SiteLayout>
  );
}
