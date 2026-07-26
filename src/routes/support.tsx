import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
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

const TOPICS = [
  {
    icon: LifeBuoy,
    title: "Enrolment and payment",
    body: "Payment failures, GST invoices, billing details and access activation.",
  },
  {
    icon: MessageSquare,
    title: "Course and assessment",
    body: "Video playback, progress tracking, assignment submissions and reviewer feedback.",
  },
  {
    icon: Mail,
    title: "Certification",
    body: "Examination results, certificate issue, name corrections and verification queries.",
  },
];

function SupportPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const supportEmail = readString(settings, "support_email");

  return (
    <SiteLayout>
      <section className="container-page max-w-4xl py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Support</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">We&apos;re here to help</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Enrolled learners can raise a support ticket from inside the dashboard so our team can
          see your progress and payment history alongside your query.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <topic.icon className="size-5 text-accent" />
              <h2 className="mt-4 text-base font-semibold">{topic.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{topic.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-secondary/50 p-8">
          <h2 className="text-lg font-semibold">Raise a ticket</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your dashboard to open a support ticket and track its status.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to dashboard
            </Link>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center rounded-full border border-input bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Email {supportEmail}
              </a>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
