import { computeGst, type GstBreakup } from "@/domain/money";
import { readNumber, readSetting, type SettingsMap } from "@/domain/settings";

/**
 * Server-only checkout logic: pricing, order persistence, and the idempotent
 * "mark paid" path shared by the browser callback and the Razorpay webhook.
 */

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export async function loadSettings(supabaseAdmin: AdminClient): Promise<SettingsMap> {
  const { data } = await supabaseAdmin.from("settings").select("key, value");
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value as SettingsMap[string];
  return map;
}

export async function getPrimaryCourse(supabaseAdmin: AdminClient) {
  const { data } = await supabaseAdmin
    .from("courses")
    .select("id, title, slug")
    .eq("is_published", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export function priceFor(settings: SettingsMap, buyerState?: string | null): GstBreakup {
  return computeGst({
    baseAmountPaise: readNumber(settings, "course_price_paise"),
    gstRatePercent: readNumber(settings, "gst_rate_percent"),
    sellerState: String(readSetting(settings, "company_state") ?? ""),
    buyerState: buyerState ?? "",
  });
}

export async function hasActiveEnrolment(
  supabaseAdmin: AdminClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("enrolments")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function nextInvoiceNumber(supabaseAdmin: AdminClient, settings: SettingsMap) {
  const prefix = String(readSetting(settings, "invoice_prefix"));
  const next = readNumber(settings, "invoice_next_number");
  await supabaseAdmin
    .from("settings")
    .update({ value: next + 1 })
    .eq("key", "invoice_next_number");
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export type MarkPaidInput = {
  orderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string | null;
  method?: string | null;
  amountPaise: number;
  rawEvent?: unknown;
};

/**
 * Idempotent: safe to call from both the browser callback and the webhook.
 * Records the payment, flips the order to paid, creates the enrolment and a
 * GST invoice exactly once.
 */
export async function markOrderPaid(supabaseAdmin: AdminClient, input: MarkPaidInput) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");

  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("gateway_payment_id", input.gatewayPaymentId)
    .maybeSingle();

  if (!existingPayment) {
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      user_id: order.user_id,
      gateway: "razorpay",
      gateway_payment_id: input.gatewayPaymentId,
      gateway_signature: input.gatewaySignature ?? null,
      status: "captured",
      amount_paise: input.amountPaise,
      method: input.method ?? null,
      raw_event: (input.rawEvent ?? null) as never,
    });
  }

  if (order.status === "paid") return { alreadyPaid: true, orderId: order.id };

  await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);

  const settings = await loadSettings(supabaseAdmin);
  const courseId = order.course_id ?? (await getPrimaryCourse(supabaseAdmin))?.id ?? null;

  if (courseId && !(await hasActiveEnrolment(supabaseAdmin, order.user_id))) {
    const days = readNumber(settings, "access_duration_days");
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("enrolments").insert({
      user_id: order.user_id,
      course_id: courseId,
      order_id: order.id,
      valid_until: validUntil,
      is_active: true,
      source: "purchase",
    });
  }

  const { data: existingInvoice } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (!existingInvoice) {
    await supabaseAdmin.from("invoices").insert({
      order_id: order.id,
      user_id: order.user_id,
      invoice_number: await nextInvoiceNumber(supabaseAdmin, settings),
      seller_snapshot: {
        legal_name: readSetting(settings, "company_legal_name"),
        address: readSetting(settings, "company_address"),
        gstin: readSetting(settings, "company_gstin"),
        state: readSetting(settings, "company_state"),
      } as never,
      buyer_snapshot: order.billing_snapshot as never,
      line_items: [
        {
          description: readSetting(settings, "programme_name"),
          amount_paise: order.base_amount_paise,
          discount_paise: order.discount_amount_paise,
          gst_rate_percent: order.gst_rate_percent,
          cgst_paise: order.cgst_paise,
          sgst_paise: order.sgst_paise,
          igst_paise: order.igst_paise,
        },
      ] as never,
      total_paise: order.total_amount_paise,
    });
  }

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: order.user_id,
    action: "order.paid",
    entity_type: "order",
    entity_id: order.id,
    metadata: { gateway_payment_id: input.gatewayPaymentId } as never,
  });

  return { alreadyPaid: false, orderId: order.id };
}

export async function markOrderFailed(
  supabaseAdmin: AdminClient,
  input: {
    orderId: string;
    paymentId?: string | null;
    code?: string | null;
    description?: string | null;
    amountPaise: number;
    userId: string;
  },
) {
  await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", input.orderId);
  await supabaseAdmin.from("payments").insert({
    order_id: input.orderId,
    user_id: input.userId,
    gateway: "razorpay",
    gateway_payment_id: input.paymentId ?? null,
    status: "failed",
    amount_paise: input.amountPaise,
    error_code: input.code ?? null,
    error_description: input.description ?? null,
  });
}
