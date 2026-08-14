import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPublicSettings } from "@/lib/public.functions";
import { readString } from "@/domain/settings";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support | ABB Certification Programme" },
      {
        name: "description",
        content:
          "Get help with enrolment, payments, course access, assignments, the examination or your ABB certificate.",
      },
      { property: "og:title", content: "Support | ABB Certification Programme" },
      {
        property: "og:description",
        content: "Help with enrolment, payments, course access, assignments and certification.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: SupportPage,
});

const LEARNER_SUPPORT_CATEGORIES = [
  "Course access & account activation",
  "Video playback & player support",
  "Assignment submissions & practical reviews",
  "Reviewer feedback & resubmissions",
  "Examination results & retakes",
  "Certificate corrections & name updates",
  "Certificate verification queries",
];

function SupportPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const supportEmail = readString(settings, "support_email") || "info@ybbindia.com";

  return (
    <SiteLayout>
      <section className="container-page max-w-4xl py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Support and Contact</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">We&apos;re here to help</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground text-base leading-relaxed sm:text-lg">
          Whether you are exploring enrolment or currently studying in the ABB programme, our team is ready to assist you.
        </p>

        {/* Response time notice */}
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground font-medium">
          <Clock className="size-5 shrink-0 text-accent" />
          <span>We normally respond within two business days.</span>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Pre-enrolment Support Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <HelpCircle className="size-6" />
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold text-foreground">
              Have questions before enrolling?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Contact our pre-enrolment support team for assistance with programme content, eligibility requirements, enrolment procedures, fees, or certification standards.
            </p>
            <div className="mt-6 border-t border-border pt-5">
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90"
              >
                <Mail className="size-4" />
                Email {supportEmail}
              </a>
            </div>
          </div>

          {/* Existing Learner Support Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <LifeBuoy className="size-6" />
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold text-foreground">
              Existing Learner Support
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Enrolled learners can sign in to the dashboard to raise and track support tickets directly.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {LEARNER_SUPPORT_CATEGORIES.map((cat) => (
                <li key={cat} className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-accent" />
                  <span>{cat}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-5">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageSquare className="size-4" />
                Go to Dashboard Tickets
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Identity Block */}
        <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="size-4 text-accent" />
            <span>Legal Provider Information</span>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2 text-xs">
            <div>
              <p className="text-muted-foreground">Programme & Certification Provider:</p>
              <p className="mt-1 font-semibold text-sm text-foreground">Yoova Business Broking Pvt Ltd</p>
              <p className="mt-3 text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3.5 text-accent shrink-0" /> Registered Office Address:
              </p>
              <p className="mt-1 text-foreground leading-relaxed">
                E503, Samraat Tropicano, Serene Meadows, Gangapur Road, Nashik – 422013, Maharashtra, India
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground">Support Email:</p>
                <a href={`mailto:${supportEmail}`} className="mt-1 font-medium text-foreground underline block">
                  {supportEmail}
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Official Website:</p>
                <a href="https://www.ybbindia.com" target="_blank" rel="noreferrer" className="mt-1 font-medium text-foreground underline block">
                  www.ybbindia.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

