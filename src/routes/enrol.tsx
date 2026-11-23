import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, AlertCircle, CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
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
import { getStoredUtmParams, trackInitiateCheckout } from "@/lib/meta-pixel";
import {
  normalizeIndianMobile,
  isValidIndianMobile,
  formatE164IndianMobile,
  getIndianMobileValidationError,
} from "@/lib/phone";
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
  const [phoneTouched, setPhoneTouched] = useState(false);
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
        if (saved.phone) setPhone((p) => p || normalizeIndianMobile(saved.phone) || "");
        if (typeof saved.updatesConsent === "boolean") setUpdatesConsent(saved.updatesConsent);
      }
    } catch {
      // Ignore storage read error
    }

    // Verify connection to CRM webhook on page visit
    try {
      fetch(
        "https://xrnawvpypkggpjervppb.supabase.co/functions/v1/website-webhook?form_id=wf_b8ysxrq_mwj0ax41&ping=true",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site_domain: window.location.hostname }),
        },
      ).catch(() => {});
    } catch {
      // Ignore background ping error
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as { full_name?: string; mobile?: string };
    if (user.email) setEmail((p) => p || user.email || "");
    if (meta.full_name) setFullName((p) => p || meta.full_name || "");
    if (meta.mobile) setPhone((p) => p || normalizeIndianMobile(meta.mobile) || "");
  }, [user]);

  const pricePaise = readNumber(settings, "course_price_paise");
  const accessDays = readNumber(settings, "access_duration_days");
  const programmeName = readString(settings, "programme_name");
  const paidCount = pilotStats?.paidEnrolmentsCount;
  const pilotCap = pilotStats?.pilotCap ?? 100;
  const seatsRemaining = typeof paidCount === "number" ? Math.max(0, pilotCap - paidCount) : null;

  const isPhoneValid = isValidIndianMobile(phone);
  const phoneError = getIndianMobileValidationError(phone, phoneTouched);

  const hasValidContact =
    fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    isPhoneValid;

  const canProceed = acceptedTerms && acceptedDisclosure && hasValidContact && !submitting;

  async function handleProceed(target: "checkout" | "signup" | "signin") {
    setPhoneTouched(true);
    if (!isPhoneValid) {
      toast.error("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.");
      return;
    }
    if (!hasValidContact) {
      toast.error("Please enter your full name and a valid email address.");
      return;
    }
    if (!acceptedTerms || !acceptedDisclosure) {
      toast.error("Please tick both declaration boxes before continuing.");
      return;
    }

    setSubmitting(true);
    const formattedPhone = formatE164IndianMobile(phone);
    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: formattedPhone,
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

    try {
      trackInitiateCheckout({
        value: pricePaise / 100,
        currency: "INR",
        contentName: programmeName || "ABB Certification Programme",
      });
    } catch {
      // Ignore client tracking error
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
        <div className="container-page flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-foreground">
          <span className="font-bold">Pilot batch: {pilotCap} learners.</span>
          <span className="font-semibold">
            {typeof paidCount === "number" && seatsRemaining !== null
              ? `${paidCount} joined · ${seatsRemaining} seats left at ₹1,999.`
              : "15 joined · 85 seats left at ₹1,999."}
          </span>
          <span>
            Fee becomes ₹4,999 after that. Pilot learners also get a 15-minute 1:1 call with the founder.
          </span>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="enrol-phone" className="text-xs">
                    Phone / WhatsApp number
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {phone.length}/10 digits
                  </span>
                </div>
                <div
                  className={`flex rounded-lg border bg-background shadow-xs transition-colors overflow-hidden focus-within:ring-2 ${
                    phoneError
                      ? "border-destructive focus-within:ring-destructive/30"
                      : "border-input focus-within:border-accent focus-within:ring-accent/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 border-r border-input bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground select-none shrink-0">
                    <span role="img" aria-label="India flag">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <Input
                    id="enrol-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(normalizeIndianMobile(e.target.value));
                      if (!phoneTouched) setPhoneTouched(true);
                    }}
                    onBlur={() => setPhoneTouched(true)}
                    className="border-0 shadow-none focus-visible:ring-0 rounded-none h-10 px-3 text-sm"
                    maxLength={14}
                  />
                </div>
                {phoneError ? (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-destructive mt-1">
                    <AlertCircle className="size-3 shrink-0" />
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    10-digit Indian mobile number (starting with 6, 7, 8 or 9).
                  </p>
                )}
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

