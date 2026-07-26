import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/public.functions";
import { computeGst, formatPaiseExact } from "@/domain/money";
import { readNumber } from "@/domain/settings";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | ABB Certification Programme" },
      { name: "description", content: "Complete your enrolment payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const pricePaise = readNumber(settings, "course_price_paise");
  const gstRatePercent = readNumber(settings, "gst_rate_percent");
  const breakup = computeGst({ baseAmountPaise: pricePaise, gstRatePercent });

  return (
    <AppShell title="Checkout">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review your order and confirm your billing details before payment.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-7 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Programme fee</dt>
              <dd className="font-medium">{formatPaiseExact(breakup.taxableAmountPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">GST ({gstRatePercent}%)</dt>
              <dd className="font-medium">{formatPaiseExact(breakup.totalTaxPaise)}</dd>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
              <dt className="font-semibold">Total payable</dt>
              <dd className="font-display font-semibold">
                {formatPaiseExact(breakup.totalAmountPaise)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Billing details and secure payment are set up in the next build step. Your account is
            ready and your order will be created here.
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
            A GST invoice is issued automatically once payment is confirmed.
          </p>

          <Button variant="outline" asChild className="mt-6">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
