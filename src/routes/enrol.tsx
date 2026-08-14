import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { getPublicSettings } from "@/lib/public.functions";
import { formatPaiseExact } from "@/domain/money";
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

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(false);

  const pricePaise = readNumber(settings, "course_price_paise");
  const accessDays = readNumber(settings, "access_duration_days");
  const programmeName = readString(settings, "programme_name");

  const canProceed = acceptedTerms && acceptedDisclosure;

  return (
    <SiteLayout>
      <section className="container-page grid max-w-5xl gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Enrolment</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Join the {programmeName}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
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

        <aside className="lg:sticky lg:top-28 lg:self-start space-y-6">
          {/* Order summary box */}
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

            {/* Mandatory Checkboxes before payment */}
            <div className="mt-7 space-y-4 border-t border-border pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accepted-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
                  className="mt-0.5"
                />
                <label htmlFor="accepted-terms" className="text-xs leading-relaxed text-foreground/90 cursor-pointer">
                  I confirm that I have reviewed the programme details and agree to the{" "}
                  <Link to="/legal/$slug" params={{ slug: "terms" }} target="_blank" className="text-accent underline font-medium">
                    Terms of Use
                  </Link>
                  ,{" "}
                  <Link to="/legal/$slug" params={{ slug: "privacy" }} target="_blank" className="text-accent underline font-medium">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/legal/$slug" params={{ slug: "refund" }} target="_blank" className="text-accent underline font-medium">
                    Refund Policy
                  </Link>
                  . I understand that no refund is available after course access is activated.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="accepted-disclosure"
                  checked={acceptedDisclosure}
                  onCheckedChange={(checked) => setAcceptedDisclosure(Boolean(checked))}
                  className="mt-0.5"
                />
                <label htmlFor="accepted-disclosure" className="text-xs leading-relaxed text-foreground/90 cursor-pointer">
                  I understand that ABB is a professional certification issued by Yoova Business
                  Broking Pvt Ltd and is not a government licence, statutory authorisation or guarantee
                  of employment, income or business results.
                </label>
              </div>
            </div>

            <div className="mt-7">
              {loading ? null : user ? (
                <Button size="lg" className="w-full rounded-lg" disabled={!canProceed} asChild={canProceed}>
                  {canProceed ? (
                    <Link to="/checkout">
                      Continue to checkout
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <span>Continue to checkout</span>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button size="lg" className="w-full rounded-lg" disabled={!canProceed} asChild={canProceed}>
                    {canProceed ? (
                      <Link to="/auth" search={{ mode: "signup", redirect: "/checkout" }}>
                        Create account to continue
                      </Link>
                    ) : (
                      <span>Create account to continue</span>
                    )}
                  </Button>
                  <Button size="lg" variant="outline" className="w-full rounded-lg" disabled={!canProceed} asChild={canProceed}>
                    {canProceed ? (
                      <Link to="/auth" search={{ mode: "signin", redirect: "/checkout" }}>
                        I already have an account
                      </Link>
                    ) : (
                      <span>I already have an account</span>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {!canProceed && (
              <p className="mt-3 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
                Please tick both declaration boxes above to proceed.
              </p>
            )}

            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
              Payments are processed securely. A payment receipt/invoice is issued automatically once payment is
              confirmed.
            </p>
          </div>

          {/* Section 12 Trust Panel: Before You Enrol */}
          <div className="rounded-2xl border border-border/80 bg-secondary/40 p-6">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Before You Enrol
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              {[
                "365 days of programme access",
                "11 structured learning modules",
                "50 video lessons",
                "Practical assignments and reviewer feedback",
                "50-question final examination",
                "70% minimum passing score",
                "Unique and publicly verifiable ABB certificate",
                "Certification issued by Yoova Business Broking Pvt Ltd",
                "No refund after course access is activated",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}

