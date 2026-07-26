import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { formatPaiseExact } from "@/domain/money";
import { toast } from "sonner";
import {
  getCheckoutSummary,
  createEnrolmentOrder,
  confirmEnrolmentPayment,
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
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
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
  const [busy, setBusy] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["checkout-summary"],
    queryFn: () => fetchSummary(),
  });

  async function handlePay() {
    setBusy(true);
    try {
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) throw new Error("Payment window could not be loaded.");

      const order = await createOrder();

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
          ondismiss: () => {
            setBusy(false);
            toast.info("Payment cancelled. Your order is saved — you can try again.");
          },
        },
        handler: async (response: RazorpayResponse) => {
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
            navigate({ to: "/dashboard" });
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
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{summary.courseTitle}</dt>
                  <dd className="font-medium">{formatPaiseExact(summary.baseAmountPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GST ({summary.gstRatePercent}%)</dt>
                  <dd className="font-medium">{formatPaiseExact(summary.totalTaxPaise)}</dd>
                </div>
                <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
                  <dt className="font-semibold">Total payable</dt>
                  <dd className="font-display font-semibold">
                    {formatPaiseExact(summary.totalAmountPaise)}
                  </dd>
                </div>
              </dl>

              <Button className="mt-8 w-full" onClick={handlePay} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? "Opening secure payment…" : "Pay securely with Razorpay"}
              </Button>

              <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
                Payments are processed by Razorpay. A GST invoice is issued automatically once
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
