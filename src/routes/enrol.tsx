import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  captureEnrolmentLead,
  getPublicPilotStats,
  getPublicSettings,
} from "@/lib/public.functions";
import { getStoredUtmParams } from "@/lib/meta-pixel";
import { formatPaiseExact } from "@/domain/money";
import { readNumber, readString } from "@/domain/settings";
import { toast } from "sonner";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

const pilotStatsQuery = queryOptions({
  queryKey: ["public-pilot-stats"],
  queryFn: () => getPublicPilotStats(),
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
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(pilotStatsQuery),
    ]);
  },
  component: EnrolPage,
});

function EnrolPage() {
  const navigate = useNavigate();
  const saveLead = useServerFn(captureEnrolmentLead);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: pilotStats } = useSuspenseQuery(pilotStatsQuery);
  const { user, loading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [updatesConsent, setUpdatesConsent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem("ybb_enrol_lead") ||
        window.sessionStorage.getItem("ybb_enrol_lead");
      if (raw) {
        const saved = JSON.parse(raw) as {
          fullName?: string;
          email?: string;
          phone?: string;
          updatesConsent?: boolean;
        };
        if (saved.fullName) setFullName((p) => p || saved.fullName || "");
        if (saved.email) setEmail((p) => p || saved.email || "");
        if (saved.phone) setPhone((p) => p || saved.phone || "");
        if (typeof saved.updatesConsent === "boolean") setUpdatesConsent(saved.updatesConsent);
      }
    } catch {
      // Ignore storage read error
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as { full_name?: string; mobile?: string };
    if (user.email) setEmail((p) => p || user.email || "");
    if (meta.full_name) setFullName((p) => p || meta.full_name || "");
    if (meta.mobile) setPhone((p) => p || meta.mobile || "");
  }, [user]);

  const pricePaise = readNumber(settings, "course_price_paise");
  const accessDays = readNumber(settings, "access_duration_days");
  const programmeName = readString(settings, "programme_name");
  const paidCount = pilotStats?.paidEnrolmentsCount;
  const pilotCap = pilotStats?.pilotCap ?? 100;
  const seatsRemaining = typeof paidCount === "number" ? Math.max(0, pilotCap - paidCount) : null;

  const hasValidContact =
    fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.replace(/\D/g, "").length >= 10;

  const canProceed = acceptedTerms && acceptedDisclosure && hasValidContact && !submitting;

  async function handleProceed(target: "checkout" | "signup" | "signin") {
    if (!hasValidContact) {
      toast.error("Please enter your full name, a valid email address, and a 10+ digit phone number.");
      return;
    }
    if (!acceptedTerms || !acceptedDisclosure) {
      toast.error("Please tick both declaration boxes before continuing.");
      return;
    }

    setSubmitting(true);
    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      updatesConsent,
    };

    try {
      const serialized = JSON.stringify(payload);
      window.localStorage.setItem("ybb_enrol_lead", serialized);
      window.sessionStorage.setItem("ybb_enrol_lead", serialized);
    } catch {
      // Ignore storage write error
    }

    try {
      await saveLead({
        data: {
          ...payload,
          utmParams: getStoredUtmParams(),
          userId: user?.id ?? null,
        },
      });
    } catch {
      // Do not block checkout if background lead logging fails
    } finally {
      setSubmitting(false);
    }

    if (target === "checkout") {
      navigate({ to: "/checkout" });
    } else {
      navigate({ to: "/auth", search: { mode: target, redirect: "/checkout" } });
    }
  }

  return (
    <SiteLayout>
      {/* Pilot Announcement Banner at Top of Enrol Page */}
      <aside
        aria-label="Pilot cohort offer"
        className="border-b border-accent/40 bg-accent/15 px-4 py-2.5 text-center text-xs font-medium text-foreground sm:text-sm"
      >
        <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="font-semibold text-accent">Pilot offer:</span>
          <span>
            ₹1,999 for the first 100 learners. Fee becomes ₹4,999 after that. Pilot learners also get
            a 15-minute 1:1 call with the founder.
          </span>
          {typeof paidCount === "number" && seatsRemaining !== null && (
            <span className="inline-flex items-center rounded-full bg-accent/25 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
              {paidCount} / {pilotCap} claimed · {seatsRemaining} remaining
            </span>
          )}
        </div>
      </aside>

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
                body: "We use these for your payment receipt and the name printed on your certificate.",
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
            <div className="mb-5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs leading-relaxed text-foreground">
              <p className="font-semibold text-accent">
                Pilot offer: ₹1,999 for the first 100 learners. Fee becomes ₹4,999 after that.
                Pilot learners also get a 15-minute 1:1 call with the founder.
              </p>
              {typeof paidCount === "number" && seatsRemaining !== null && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {paidCount} / {pilotCap} pilot seats claimed · {seatsRemaining} remaining
                </p>
              )}
            </div>

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

            {/* Contact Details captured pre-payment */}
            <div className="mt-6 space-y-3.5 border-t border-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your contact details
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="enrol-name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="enrol-name"
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="enrol-email" className="text-xs">
                  Email address
                </Label>
                <Input
                  id="enrol-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="enrol-phone" className="text-xs">
                  Phone / WhatsApp number
                </Label>
                <Input
                  id="enrol-phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-3 pt-1">
                <Checkbox
                  id="updates-consent"
                  checked={updatesConsent}
                  onCheckedChange={(checked) => setUpdatesConsent(Boolean(checked))}
                  className="mt-0.5"
                />
                <label
                  htmlFor="updates-consent"
                  className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
                >
                  I agree to receive programme updates via WhatsApp and email from Yoova Business
                  Broking.
                </label>
              </div>
            </div>

            {/* Mandatory Checkboxes before payment */}
            <div className="mt-6 space-y-4 border-t border-border pt-6">
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
                <Button
                  type="button"
                  size="lg"
                  className="w-full rounded-lg"
                  disabled={!canProceed}
                  onClick={() => handleProceed("checkout")}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Continue to checkout
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full rounded-lg"
                    disabled={!canProceed}
                    onClick={() => handleProceed("signup")}
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Create account to continue
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="w-full rounded-lg"
                    disabled={!canProceed}
                    onClick={() => handleProceed("signin")}
                  >
                    I already have an account
                  </Button>
                </div>
              )}
            </div>

            {!canProceed && (
              <p className="mt-3 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
                Please enter your name, email &amp; phone and tick both declaration boxes above to
                proceed.
              </p>
            )}

            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
              Payments are processed securely. A payment receipt is issued automatically once payment is
              confirmed.
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Private educational certification by Yoova Business Broking Pvt Ltd. Not a government
              licence or regulatory approval. No guarantee of income or clients.
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
                "Course language: English",
                "Deal workbooks & transaction frameworks",
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

