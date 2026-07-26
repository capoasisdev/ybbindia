import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook. Public by path (external caller), secured by an HMAC
 * signature over the raw body using RAZORPAY_WEBHOOK_SECRET.
 * Handles: payment.captured, order.paid, payment.failed.
 */
export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature");

        const { verifyWebhookSignature } = await import("@/lib/razorpay.server");
        if (!verifyWebhookSignature(rawBody, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          payload?: {
            payment?: { entity?: Record<string, unknown> };
            order?: { entity?: Record<string, unknown> };
          };
        };
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const payment = event.payload?.payment?.entity as
          | { id?: string; order_id?: string; amount?: number; method?: string; error_code?: string; error_description?: string }
          | undefined;
        const gatewayOrderId =
          payment?.order_id ??
          (event.payload?.order?.entity as { id?: string } | undefined)?.id ??
          null;

        if (!gatewayOrderId) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { markOrderPaid, markOrderFailed } = await import("@/lib/checkout.server");

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, user_id, total_amount_paise, status")
          .eq("gateway_order_id", gatewayOrderId)
          .maybeSingle();

        if (!order) {
          console.warn(`Razorpay webhook for unknown order ${gatewayOrderId}`);
          return new Response("ok");
        }

        try {
          if (event.event === "payment.captured" || event.event === "order.paid") {
            await markOrderPaid(supabaseAdmin, {
              orderId: order.id,
              gatewayPaymentId: payment?.id ?? gatewayOrderId,
              method: payment?.method ?? null,
              amountPaise: payment?.amount ?? order.total_amount_paise,
              rawEvent: event,
            });
          } else if (event.event === "payment.failed" && order.status !== "paid") {
            await markOrderFailed(supabaseAdmin, {
              orderId: order.id,
              userId: order.user_id,
              paymentId: payment?.id ?? null,
              code: payment?.error_code ?? null,
              description: payment?.error_description ?? null,
              amountPaise: payment?.amount ?? order.total_amount_paise,
            });
          }
        } catch (error) {
          console.error("Razorpay webhook processing failed", error);
          return new Response("Processing error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
