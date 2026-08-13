import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getPublicSettings } from "@/lib/public.functions";
import { computeGst, formatPaiseExact } from "@/domain/money";
import { readNumber, readString } from "@/domain/settings";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/enrol")({
  head: () => ({
    meta: [
      { title: "Enrol | ABB Certification Programme" },
      {
        name: "description",
        content:
          "Enrol in the Authorised Business Broker certification programme by Yoova Business Broking.",
      },
      { property: "og:title", content: "Enrol | ABB Certification Programme" },
      {
        property: "og:description",
        content: "Enrol in the ABB certification programme by Yoova Business Broking.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: EnrolPage,
});

function EnrolPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { user, loading } = useAuth();

  const pricePaise = readNumber(settings, "course_price_paise");
  const gstRatePercent = readNumber(settings, "gst_rate_percent");
  const accessDays = readNumber(settings, "access_duration_days");
  const programmeName = readString(settings, "programme_name");

  const breakup = computeGst({ baseAmountPaise: pricePaise, gstRatePercent });

  return (
    <SiteLayout>
      <section className="container-page grid max-w-5xl gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Enrolment</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Join the {programmeName}</h1>
          <p className="mt-4 text-muted-foreground">
            Enrolment takes three steps: create your account, confirm your billing details, and pay
            securely. Access is activated the moment payment succeeds.
          </p>

          <ol className="mt-10 space-y-4">
            {[
              {
                title: "Create your learner account",
                body: "Your email address becomes your sign-in and receives all certification updates.",
              },
              {
                title: "Confirm billing and certificate details",
                body: "We use these for your payment receipt/invoice and the name printed on your certificate.",
              },
              {
                title: "Pay the programme fee",
                body: `Secure payment in INR. Your ${accessDays}-day access begins immediately.`,
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-semibold">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold">{step.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-7 shadow-lift">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Programme fee</dt>
                <dd className="font-medium">{formatPaiseExact(pricePaise)}</dd>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
                <dt className="font-semibold">Total payable</dt>
                <dd className="font-display font-semibold">
                  {formatPaiseExact(pricePaise)}
                </dd>
              </div>
            </dl>

            <div className="mt-7">
              {loading ? null : user ? (
                <Button size="lg" className="w-full rounded-lg" asChild>
                  <Link to="/checkout">
                    Continue to checkout
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button size="lg" className="w-full rounded-lg" asChild>
                    <Link to="/auth" search={{ mode: "signup", redirect: "/checkout" }}>
                      Create account to continue
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full rounded-lg" asChild>
                    <Link to="/auth" search={{ mode: "signin", redirect: "/checkout" }}>
                      I already have an account
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
              Payments are processed securely. A payment receipt/invoice is issued automatically once payment is
              confirmed.
            </p>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
