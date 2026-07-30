import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Client-callable checkout API. Every handler is a thin wrapper: shared logic
 * lives in checkout.server.ts / razorpay.server.ts.
 */

export type CheckoutSummary = {
  courseId: string | null;
  courseTitle: string | null;
  currency: string;
  isEnrolled: boolean;
  baseAmountPaise: number;
  gstRatePercent: number;
  totalTaxPaise: number;
  totalAmountPaise: number;
  buyerState: string | null;
  fullName: string | null;
  email: string | null;
  mobile: string | null;
  testMode: boolean;
};

export const getCheckoutSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CheckoutSummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadSettings, getPrimaryCourse, priceFor, hasActiveEnrolment } =
      await import("./checkout.server");
    const { readSetting } = await import("@/domain/settings");

    const [settings, course, enrolled] = await Promise.all([
      loadSettings(supabaseAdmin),
      getPrimaryCourse(supabaseAdmin),
      hasActiveEnrolment(supabaseAdmin, context.userId),
    ]);

    const { data: profile } = await context.supabase
      .from("learner_profiles")
      .select("full_name, email, mobile, billing_state, state")
      .eq("id", context.userId)
      .maybeSingle();

    const buyerState = profile?.billing_state ?? profile?.state ?? null;
    const price = priceFor(settings, buyerState);

    return {
      courseId: course?.id ?? null,
      courseTitle: course?.title ?? String(readSetting(settings, "programme_name")),
      currency: String(readSetting(settings, "currency")),
      isEnrolled: enrolled,
      baseAmountPaise: price.baseAmountPaise,
      gstRatePercent: price.gstRatePercent,
      totalTaxPaise: price.totalTaxPaise,
      totalAmountPaise: price.totalAmountPaise,
      buyerState,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      mobile: profile?.mobile ?? null,
      testMode: Boolean(readSetting(settings, "payments_test_mode")),
    };
  });

export type CreatedOrder = {
  orderId: string;
  gatewayOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  name: string;
  prefill: { name: string; email: string; contact: string };
};

export const createEnrolmentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreatedOrder> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadSettings, getPrimaryCourse, priceFor, hasActiveEnrolment } =
      await import("./checkout.server");
    const { createRazorpayOrder, getRazorpayKeyId } = await import("./razorpay.server");
    const { readSetting } = await import("@/domain/settings");

    if (await hasActiveEnrolment(supabaseAdmin, context.userId)) {
      throw new Error("You already have an active enrolment.");
    }

    const settings = await loadSettings(supabaseAdmin);
    const course = await getPrimaryCourse(supabaseAdmin);

    const { data: profile } = await context.supabase
      .from("learner_profiles")
      .select(
        "full_name, email, mobile, billing_address, billing_city, billing_state, billing_pincode, gst_number, state",
      )
      .eq("id", context.userId)
      .maybeSingle();

    const buyerState = profile?.billing_state ?? profile?.state ?? null;
    const price = priceFor(settings, buyerState);
    const currency = String(readSetting(settings, "currency"));

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        course_id: course?.id ?? null,
        status: "created",
        base_amount_paise: price.baseAmountPaise,
        discount_amount_paise: price.discountAmountPaise,
        gst_rate_percent: price.gstRatePercent,
        cgst_paise: price.cgstPaise,
        sgst_paise: price.sgstPaise,
        igst_paise: price.igstPaise,
        total_amount_paise: price.totalAmountPaise,
        currency,
        gateway: "razorpay",
        billing_snapshot: {
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          mobile: profile?.mobile ?? null,
          address: profile?.billing_address ?? null,
          city: profile?.billing_city ?? null,
          state: buyerState,
          pincode: profile?.billing_pincode ?? null,
          gst_number: profile?.gst_number ?? null,
        } as never,
      })
      .select("id")
      .single();

    if (error || !order) {
      console.error("Order insert failed", error);
      throw new Error("Could not create your order. Please try again.");
    }

    const gatewayOrder = await createRazorpayOrder({
      amountPaise: price.totalAmountPaise,
      currency,
      receipt: order.id,
      notes: { order_id: order.id, user_id: context.userId },
    });

    await supabaseAdmin
      .from("orders")
      .update({ gateway_order_id: gatewayOrder.id, status: "pending" })
      .eq("id", order.id);

    return {
      orderId: order.id,
      gatewayOrderId: gatewayOrder.id,
      keyId: getRazorpayKeyId(),
      amountPaise: price.totalAmountPaise,
      currency,
      name: String(readSetting(settings, "company_legal_name")),
      prefill: {
        name: profile?.full_name ?? "",
        email: profile?.email ?? "",
        contact: profile?.mobile ?? "",
      },
    };
  });

export const confirmEnrolmentPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      orderId: z.string().uuid(),
      razorpayOrderId: z.string().min(1).max(120),
      razorpayPaymentId: z.string().min(1).max(120),
      signature: z.string().min(1).max(256),
    }).parse,
  )
  .handler(async ({ data, context }): Promise<{ status: "paid" }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { markOrderPaid } = await import("./checkout.server");
    const { verifyCheckoutSignature, fetchRazorpayPayment } = await import("./razorpay.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, gateway_order_id, total_amount_paise")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order || order.user_id !== context.userId) throw new Error("Order not found");
    if (order.gateway_order_id !== data.razorpayOrderId) throw new Error("Order mismatch");

    if (
      !verifyCheckoutSignature({
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        signature: data.signature,
      })
    ) {
      throw new Error("Payment signature could not be verified.");
    }

    const payment = await fetchRazorpayPayment(data.razorpayPaymentId);
    if (payment.order_id !== data.razorpayOrderId) throw new Error("Payment mismatch");
    if (payment.status !== "captured" && payment.status !== "authorized") {
      throw new Error("Payment is not complete yet.");
    }
    if (payment.amount !== order.total_amount_paise) throw new Error("Payment amount mismatch");

    await markOrderPaid(supabaseAdmin, {
      orderId: order.id,
      gatewayPaymentId: payment.id,
      gatewaySignature: data.signature,
      method: payment.method ?? null,
      amountPaise: payment.amount,
      rawEvent: payment,
    });

    return { status: "paid" };
  });

/**
 * TEST MODE ONLY. Fulfils an enrolment without contacting Razorpay so the rest
 * of the platform (course access, assignments, exam, certificate) can be tested
 * end to end. Refuses to run unless the `payments_test_mode` setting is true,
 * so flipping that setting off at go-live disables this endpoint entirely.
 */
export const simulateEnrolmentPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ status: "paid" }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadSettings, getPrimaryCourse, priceFor, hasActiveEnrolment, markOrderPaid } =
      await import("./checkout.server");
    const { readSetting } = await import("@/domain/settings");

    const settings = await loadSettings(supabaseAdmin);
    if (!readSetting(settings, "payments_test_mode")) {
      throw new Error("Test payments are disabled.");
    }

    if (await hasActiveEnrolment(supabaseAdmin, context.userId)) {
      throw new Error("You already have an active enrolment.");
    }

    const course = await getPrimaryCourse(supabaseAdmin);

    const { data: profile } = await context.supabase
      .from("learner_profiles")
      .select(
        "full_name, email, mobile, billing_address, billing_city, billing_state, billing_pincode, gst_number, state",
      )
      .eq("id", context.userId)
      .maybeSingle();

    const buyerState = profile?.billing_state ?? profile?.state ?? null;
    const price = priceFor(settings, buyerState);
    const currency = String(readSetting(settings, "currency"));
    const stamp = Date.now().toString(36);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        course_id: course?.id ?? null,
        status: "pending",
        base_amount_paise: price.baseAmountPaise,
        discount_amount_paise: price.discountAmountPaise,
        gst_rate_percent: price.gstRatePercent,
        cgst_paise: price.cgstPaise,
        sgst_paise: price.sgstPaise,
        igst_paise: price.igstPaise,
        total_amount_paise: price.totalAmountPaise,
        currency,
        gateway: "razorpay",
        gateway_order_id: `test_order_${stamp}`,
        billing_snapshot: {
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          mobile: profile?.mobile ?? null,
          address: profile?.billing_address ?? null,
          city: profile?.billing_city ?? null,
          state: buyerState,
          pincode: profile?.billing_pincode ?? null,
          gst_number: profile?.gst_number ?? null,
          test_mode: true,
        } as never,
      })
      .select("id")
      .single();

    if (error || !order) {
      console.error("Test order insert failed", error);
      throw new Error("Could not create the test order.");
    }

    await markOrderPaid(supabaseAdmin, {
      orderId: order.id,
      gatewayPaymentId: `test_pay_${stamp}`,
      gatewaySignature: null,
      method: "test",
      amountPaise: price.totalAmountPaise,
      rawEvent: { simulated: true, at: new Date().toISOString() },
    });

    return { status: "paid" };
  });
