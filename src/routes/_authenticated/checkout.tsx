import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FlaskConical, Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { formatPaiseExact } from "@/domain/money";
import { getStoredUtmParams, trackInitiateCheckout } from "@/lib/meta-pixel";
import { toast } from "sonner";
import {
  getCheckoutSummary,
  createEnrolmentOrder,
  confirmEnrolmentPayment,
  recordEnrolmentOrderFailure,
  simulateEnrolmentPayment,
} from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | ABB Certification Programme" },
      { name: "description", content: "Complete your enrolment payment securely." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const navigate = useNavigate();
  const fetchSummary = useServerFn(getCheckoutSummary);
  const createOrder = useServerFn(createEnrolmentOrder);
  const confirmPayment = useServerFn(confirmEnrolmentPayment);
  const recordOrderFailure = useServerFn(recordEnrolmentOrderFailure);
  const simulatePayment = useServerFn(simulateEnrolmentPayment);
  const [busy, setBusy] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: "cancelled" | "failed";
    message: string;
  } | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["checkout-summary"],
    queryFn: () => fetchSummary(),
  });

  function readUpdatesConsent(): boolean | undefined {
    try {
      const raw =
        window.localStorage.getItem("ybb_enrol_lead") ||
        window.sessionStorage.getItem("ybb_enrol_lead");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { updatesConsent?: boolean };
      return typeof parsed.updatesConsent === "boolean" ? parsed.updatesConsent : undefined;
    } catch {
      return undefined;
    }
  }

  async function handleSimulate() {
    setBusy(true);
    try {
      const utmParams = getStoredUtmParams();
      const result = await simulatePayment({ data: { utmParams } });
      toast.success("Test payment recorded. You're enrolled!");
      navigate({ to: "/payment-success", search: { orderId: result.orderId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test payment failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    setBusy(true);
    if (summary) {
      trackInitiateCheckout({
        value: summary.totalAmountPaise / 100,
        currency: summary.currency || "INR",
        contentName: summary.courseTitle ?? "ABB Certification Programme",
      });
    }
    try {
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) throw new Error("Payment window could not be loaded.");

      const utmParams = getStoredUtmParams();
      const updatesConsent = readUpdatesConsent();
      const order = await createOrder({ data: { utmParams, updatesConsent } });

      const razorpay = new window.Razorpay({
        key: order.keyId,
        order_id: order.gatewayOrderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: order.name,
        description: summary?.courseTitle ?? "Enrolment",
        prefill: order.prefill,
        theme: { color: "#12233f" },
        modal: {
          ondismiss: async () => {
            setBusy(false);
            setPaymentNotice({
              type: "cancelled",
              message:
                "Payment popup was closed. You have not been charged. Click below to try again whenever you are ready.",
            });
            try {
              await recordOrderFailure({
                data: {
                  orderId: order.orderId,
                  description: "Payment cancelled by user from Razorpay popup",
                },
              });
            } catch {
              // Ignore background logging failure
            }
            toast.error("Payment cancelled. Enrolment was not completed. You can try again whenever you are ready.");
          },
        },
        handler: async (response: RazorpayResponse) => {
          if (!response?.razorpay_payment_id || !response?.razorpay_signature) {
            setBusy(false);
            toast.error("Payment details incomplete. Enrolment was not processed.");
            return;
          }
          try {
            await confirmPayment({
              data: {
                orderId: order.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            toast.success("Payment confirmed. You're enrolled!");
            navigate({ to: "/payment-success", search: { orderId: order.orderId } });
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "We received your payment but could not confirm it yet.",
            );
          } finally {
            setBusy(false);
          }
        },
      });

      if (typeof razorpay.on === "function") {
        razorpay.on("payment.failed", async (response: unknown) => {
          setBusy(false);
          const err = (response as { error?: { description?: string; code?: string; metadata?: { payment_id?: string } } })?.error;
          const description = err?.description || "Payment was cancelled or failed.";
          setPaymentNotice({
            type: "failed",
            message: `Payment failed: ${description}. You can retry with UPI (GPay/PhonePe/Paytm), another card, or Net Banking.`,
          });
          try {
            await recordOrderFailure({
              data: {
                orderId: order.orderId,
                paymentId: err?.metadata?.payment_id ?? null,
                code: err?.code ?? null,
                description,
              },
            });
          } catch {
            // Ignore background logging failure
          }
          toast.error(`Payment failed: ${description}`);
        });
      }

      razorpay.open();
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Could not start the payment.");
    }
  }

  return (
    <AppShell title="Checkout">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review your order and pay securely to activate your enrolment.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-7 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>

          {isLoading || !summary ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading your order…
            </div>
          ) : summary.isEnrolled ? (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                You already have an active enrolment — no payment needed.
              </p>
              <Button asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              {paymentNotice ? (
                <div
                  className={`mt-6 rounded-xl border p-4 text-sm ${
                    paymentNotice.type === "failed"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-warning/40 bg-warning/10 text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-semibold">
                        {paymentNotice.type === "failed" ? "Payment Not Completed" : "Payment Cancelled"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {paymentNotice.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{summary.courseTitle}</dt>
                  <dd className="font-medium">{formatPaiseExact(summary.totalAmountPaise)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="size-3.5 text-accent" /> Full 365 Days Access
                  </span>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    Instant Activation
                  </span>
                </div>
                <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
                  <dt className="font-semibold">Total payable</dt>
                  <dd className="font-display font-semibold">
                    {formatPaiseExact(summary.totalAmountPaise)}
                  </dd>
                </div>
              </dl>

              {/* Inclusions summary */}
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What’s Included in Your Programme Access
                </p>
                <ul className="mt-3 space-y-2 text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    <span><strong>50 Masterclass Video Lessons</strong> across 11 modules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    <span><strong>5 Deal Workbooks & Templates</strong> (VDR checklist, valuation models)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    <span><strong>Verifiable Certificate</strong> with unique credential ID & QR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    <span><strong>365 Days Access</strong> on mobile and desktop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    <span><strong>15-Minute 1:1 Founder Welcome Session</strong> (Pilot cohort benefit)</span>
                  </li>
                </ul>
              </div>

              <Button className="mt-6 w-full" onClick={handlePay} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy
                  ? "Opening secure payment…"
                  : paymentNotice
                    ? "Try Payment Again"
                    : "Pay securely with Razorpay"}
              </Button>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">UPI (GPay · PhonePe · Paytm)</span>
                <span>•</span>
                <span>Cards & Net Banking</span>
                <span>•</span>
                <span>256-bit Encrypted</span>
              </div>

              {summary.testMode ? (
                <div className="mt-6 rounded-xl border border-dashed border-warning/60 bg-warning/5 p-5">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div>
                      <p className="text-sm font-medium">Test mode is on</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Simulate a successful payment to activate a real enrolment, payment receipt and
                        365-day access — with no money moving. Turn test mode off before launch.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={handleSimulate}
                    disabled={busy}
                  >
                    Simulate successful payment
                  </Button>
                </div>
              ) : null}

              <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
                Payments are processed by Razorpay. A payment receipt is issued automatically once
                payment is confirmed.
              </p>

              <Button variant="outline" asChild className="mt-6">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
