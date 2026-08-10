import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildOverview, loadEnrolment, loadPaper, shuffle } from "./exam.server";
import type { ExamOverview, ExamPaper, ExamQuestion, ExamResult } from "./exam.types";

export type {
  ExamAttemptSummary,
  ExamOverview,
  ExamPaper,
  ExamQuestion,
  ExamResult,
} from "./exam.types";

/** Exam rules, eligibility checks and the learner's attempt history. */
export const getExamOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamOverview> =>
    buildOverview(context.supabase, context.userId),
  );

/** Starts a timed attempt with a randomised question snapshot. */
export const startExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamPaper> => {
    const { supabase, userId } = context;
    const overview = await buildOverview(supabase, userId);
    if (overview.activeAttempt) {
      return await loadPaper(supabase, userId, overview.activeAttempt.id);
    }
    if (!overview.eligibility.canStart) {
      throw new Error(overview.eligibility.reasons[0] ?? "You cannot start the exam yet");
    }

    const enrolment = await loadEnrolment(supabase, userId);
    if (!enrolment) throw new Error("You are not enrolled in the programme");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bank } = await supabaseAdmin
      .from("questions")
      .select("id, prompt, options, marks")
      .eq("course_id", enrolment.course_id)
      .eq("is_archived", false);

    const pool = bank ?? [];
    if (pool.length === 0) throw new Error("The question bank is empty");

    const snapshot: ExamQuestion[] = shuffle(pool)
      .slice(0, overview.config.questionCount)
      .map((q: any) => {
        const rawOpts = Array.isArray(q.options) ? q.options : [];
        const isObjectStyle = rawOpts.length > 0 && typeof rawOpts[0] === 'object' && rawOpts[0] !== null && 'text' in rawOpts[0];
        const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
        const formattedOptions = isObjectStyle 
          ? rawOpts.map((o: any) => ({ id: o.id || ids[rawOpts.indexOf(o)] || "a", text: o.text || "" }))
          : rawOpts.map((o: any, idx: number) => ({ id: ids[idx] || String(idx), text: String(o) }));
        
        return {
          id: q.id,
          prompt: q.prompt,
          options: shuffle(formattedOptions),
          marks: q.marks ?? 1,
        };
      });

    const expiresAt = new Date(Date.now() + overview.config.durationMinutes * 60_000).toISOString();

    const { data: inserted, error } = await supabaseAdmin
      .from("exam_attempts")
      .insert({
        user_id: userId,
        course_id: enrolment.course_id,
        attempt_number: overview.eligibility.attemptsUsed + 1,
        status: "in_progress",
        question_count: snapshot.length,
        duration_minutes: overview.config.durationMinutes,
        pass_percent: overview.config.passPercent,
        expires_at: expiresAt,
        question_snapshot: snapshot,
        answers: {},
      })
      .select("id, expires_at")
      .single();
    if (error) throw new Error(error.message);

    return {
      attemptId: inserted.id,
      expiresAt: inserted.expires_at,
      questions: snapshot,
      answers: {},
    };
  });

/** Reloads an in-progress attempt (resume after refresh). */
export const resumeExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attemptId: string }) => input)
  .handler(async ({ data, context }): Promise<ExamPaper> =>
    loadPaper(context.supabase, context.userId, data.attemptId),
  );

/** Autosaves selected answers without grading. */
export const saveExamAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attemptId: string; answers: Record<string, string> }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("exam_attempts")
      .update({ answers: data.answers })
      .eq("id", data.attemptId)
      .eq("user_id", context.userId)
      .eq("status", "in_progress");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Grades and closes an attempt. Safe to call on timeout. */
export const submitExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { attemptId: string; answers: Record<string, string>; timedOut?: boolean }) => input,
  )
  .handler(async ({ data, context }): Promise<ExamResult> => {
    const { supabase, userId } = context;

    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select(
        "id, user_id, status, question_snapshot, pass_percent, score, total_marks, score_percent, is_passed",
      )
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!attempt || attempt.user_id !== userId) throw new Error("Attempt not found");

    if (attempt.status !== "in_progress") {
      return {
        scorePercent: Number(attempt.score_percent ?? 0),
        score: attempt.score ?? 0,
        totalMarks: attempt.total_marks ?? 0,
        isPassed: Boolean(attempt.is_passed),
        passPercent: attempt.pass_percent,
      };
    }

    const snapshot = (attempt.question_snapshot as unknown as ExamQuestion[]) ?? [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: keys } = await supabaseAdmin
      .from("questions")
      .select("id, correct_option_ids, marks")
      .in(
        "id",
        snapshot.map((q) => q.id),
      );

    const keyById = new Map((keys ?? []).map((k: any) => [k.id, k]));
    let score = 0;
    let totalMarks = 0;
    for (const question of snapshot) {
      const key = keyById.get(question.id);
      const marks = key?.marks ?? question.marks ?? 1;
      totalMarks += marks;
      const chosen = data.answers[question.id];
      if (chosen) {
        const correctIds = key?.correct_option_ids ?? [];
        const selectedOpt = question.options.find((o: any) => o.id === chosen);
        const chosenText = selectedOpt ? selectedOpt.text : null;
        
        const isCorrect = correctIds.includes(chosen) || (chosenText && correctIds.includes(chosenText));
        if (isCorrect) score += marks;
      }
    }

    const scorePercent = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
    const isPassed = scorePercent >= attempt.pass_percent;

    const { error } = await supabaseAdmin
      .from("exam_attempts")
      .update({
        answers: data.answers,
        status: data.timedOut ? "auto_submitted" : "submitted",
        ended_at: new Date().toISOString(),
        score,
        total_marks: totalMarks,
        score_percent: scorePercent,
        is_passed: isPassed,
      })
      .eq("id", attempt.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { scorePercent, score, totalMarks, isPassed, passPercent: attempt.pass_percent };
  });

export type CreatedAttemptOrder = {
  orderId: string;
  gatewayOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  name: string;
  prefill: { name: string; email: string; contact: string };
};

export const createAttemptOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreatedAttemptOrder> => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildOverview } = await import("./exam.server");
    const { loadSettings } = await import("./checkout.server");
    const { createRazorpayOrder, getRazorpayKeyId } = await import("./razorpay.server");
    const { computeGst } = await import("@/domain/money");
    const { readSetting, readNumber } = await import("@/domain/settings");

    const overview = await buildOverview(supabase, userId);
    if (!overview.eligibility.requiresPayment) {
      throw new Error("Payment is not required for your next attempt.");
    }

    const settings = await loadSettings(supabaseAdmin);
    const { data: profile } = await supabase
      .from("learner_profiles")
      .select("full_name, email, mobile, billing_address, billing_city, billing_state, billing_pincode, gst_number, state")
      .eq("id", userId)
      .maybeSingle();

    const buyerState = profile?.billing_state ?? profile?.state ?? null;
    const price = computeGst({
      baseAmountPaise: readNumber(settings, "exam_attempt_price_paise"),
      gstRatePercent: readNumber(settings, "gst_rate_percent"),
      sellerState: String(readSetting(settings, "company_state") ?? ""),
      buyerState: buyerState ?? "",
    });

    const currency = String(readSetting(settings, "currency") ?? "INR");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
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
          item_type: "exam_attempt",
          attempt_number: overview.eligibility.nextAttemptNumber,
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
      throw new Error("Could not create the attempt payment order.");
    }

    const gatewayOrder = await createRazorpayOrder({
      amountPaise: price.totalAmountPaise,
      currency,
      receipt: order.id,
      notes: { order_id: order.id, user_id: userId, item_type: "exam_attempt" },
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

export const confirmAttemptPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      signature: string;
    }) => input,
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

export const simulateAttemptPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ status: "paid" }> => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildOverview } = await import("./exam.server");
    const { loadSettings, markOrderPaid } = await import("./checkout.server");
    const { computeGst } = await import("@/domain/money");
    const { readSetting, readNumber, readBool } = await import("@/domain/settings");

    const overview = await buildOverview(supabase, userId);
    if (!overview.eligibility.requiresPayment) {
      throw new Error("Payment is not required for your next attempt.");
    }

    const settings = await loadSettings(supabaseAdmin);
    if (!readBool(settings, "payments_test_mode")) {
      throw new Error("Test payments are disabled.");
    }

    const { data: profile } = await supabase
      .from("learner_profiles")
      .select("full_name, email, mobile, billing_address, billing_city, billing_state, billing_pincode, gst_number, state")
      .eq("id", userId)
      .maybeSingle();

    const buyerState = profile?.billing_state ?? profile?.state ?? null;
    const price = computeGst({
      baseAmountPaise: readNumber(settings, "exam_attempt_price_paise"),
      gstRatePercent: readNumber(settings, "gst_rate_percent"),
      sellerState: String(readSetting(settings, "company_state") ?? ""),
      buyerState: buyerState ?? "",
    });

    const currency = String(readSetting(settings, "currency") ?? "INR");
    const stamp = Date.now().toString(36);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
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
        gateway_order_id: `test_attempt_order_${stamp}`,
        billing_snapshot: {
          item_type: "exam_attempt",
          attempt_number: overview.eligibility.nextAttemptNumber,
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
      throw new Error("Could not create the test attempt order.");
    }

    await markOrderPaid(supabaseAdmin, {
      orderId: order.id,
      gatewayPaymentId: `test_attempt_pay_${stamp}`,
      gatewaySignature: null,
      method: "test",
      amountPaise: price.totalAmountPaise,
      rawEvent: { simulated: true, item_type: "exam_attempt", at: new Date().toISOString() },
    });

    return { status: "paid" };
  });
