import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { formatPaiseExact } from "@/domain/money";
import { getPaidOrderReceipt } from "@/lib/checkout.functions";
import { trackPurchaseOnce } from "@/lib/meta-pixel";

export const Route = createFileRoute("/_authenticated/payment-success")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = z.object({ orderId: z.string().uuid().optional() }).safeParse(search);
    return parsed.success ? parsed.data : {};
  },
  head: () => ({
    meta: [
      { title: "Payment Confirmed | ABB Certification Programme" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { orderId } = Route.useSearch();
  const fetchReceipt = useServerFn(getPaidOrderReceipt);

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["paid-order-receipt", orderId],
    enabled: Boolean(orderId),
    queryFn: () => fetchReceipt({ data: { orderId: orderId! } }),
  });

  useEffect(() => {
    if (!receipt || receipt.status !== "paid" || receipt.isTestMode) return;
    trackPurchaseOnce({
      orderId: receipt.orderId,
      value: receipt.totalAmountPaise / 100,
      currency: receipt.currency || "INR",
    });
  }, [receipt]);

  return (
    <AppShell title="Payment Confirmed">
      <div className="mx-auto max-w-2xl py-6">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-soft">
            <Loader2 className="size-4 animate-spin" /> Confirming your payment receipt…
          </div>
        ) : !orderId || !receipt ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h1 className="text-2xl font-semibold">We could not verify that order</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If your payment was debited, your dashboard will reflect active enrolment once confirmed.
            </p>
            <Button asChild className="mt-6">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-6" />
            </div>

            <h1 className="mt-5 font-display text-3xl font-semibold">
              Payment confirmed — you&apos;re enrolled
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your access to {receipt.programmeName} is now active. A confirmation email with your
              enrolment details has been sent to your registered email address.
            </p>

            <dl className="mt-7 space-y-3 rounded-xl border border-border bg-secondary/35 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Programme</dt>
                <dd className="text-right font-medium">{receipt.programmeName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Order ID</dt>
                <dd className="font-mono text-xs">{receipt.orderId}</dd>
              </div>
              {receipt.receiptNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Receipt number</dt>
                  <dd className="font-mono text-xs font-medium">{receipt.receiptNumber}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
                <dt className="font-semibold">Amount paid</dt>
                <dd className="font-display font-semibold">
                  {formatPaiseExact(receipt.totalAmountPaise)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0 text-success" />
              Yoova Business Broking Pvt Ltd · Payment receipt issued on confirmation.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Go to learner dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

