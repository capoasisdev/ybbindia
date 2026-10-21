import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EnrolledLearnerSummary = {
  id: string; // enrolment id
  userId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  validUntil: string | null;
  isActive: boolean;
  source: string;

  // Profile
  fullName: string;
  email: string;
  mobile: string | null;
  certificateName: string | null;
  city: string | null;
  state: string | null;
  profession: string | null;
  organisation: string | null;
  registeredAt: string;

  // Order / Payment
  orderId: string | null;
  orderTotalPaise: number | null;
  orderStatus: string | null;
  invoiceNumber: string | null;

  // Progress
  lessonsCompletedCount: number;
  totalLessonsCount: number;
  progressPercent: number;

  // Assignments
  assignmentsSubmittedCount: number;
  assignmentsApprovedCount: number;
  totalCompulsoryAssignments: number;

  // Exam
  examAttemptsCount: number;
  bestScorePercent: number | null;
  hasPassedExam: boolean;

  // Certificate
  certificateStatus: string | null;
  abbId: string | null;
  certificateIssuedAt: string | null;
};

export type AdminLearnersOverview = {
  learners: EnrolledLearnerSummary[];
  stats: {
    totalEnrolled: number;
    activeEnrolments: number;
    courseCompletedCount: number;
    examPassedCount: number;
    certificatesIssuedCount: number;
    totalRevenuePaise: number;
  };
};

export type LearnerFullDetails = {
  summary: EnrolledLearnerSummary;
  profile: {
    billingAddress: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPincode: string | null;
    education: string | null;
    gstNumber: string | null;
    identityProofPath: string | null;
    photographPath: string | null;
  };
  submissions: Array<{
    id: string;
    assignmentTitle: string;
    status: string;
    marksAwarded: number | null;
    submittedAt: string;
    reviewerFeedback: string | null;
  }>;
  examAttempts: Array<{
    id: string;
    attemptNumber: number;
    status: string;
    scorePercent: number | null;
    isPassed: boolean | null;
    startedAt: string;
    endedAt: string | null;
  }>;
  recentLessons: Array<{
    lessonTitle: string;
    completedAt: string | null;
    watchedSeconds: number;
  }>;
};

async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.some((r: string) =>
    ["super_admin", "content_admin", "reviewer", "support"].includes(r),
  );
  if (!ok) throw new Error("Forbidden: staff access required");
  return roles;
}

export const listAdminLearners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminLearnersOverview> => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    // 1. Fetch all enrolments
    const { data: enrolments } = await supabase
      .from("enrolments")
      .select("id, user_id, course_id, enrolled_at, valid_until, is_active, source, order_id")
      .order("enrolled_at", { ascending: false });

    const enrolRows = enrolments ?? [];
    if (enrolRows.length === 0) {
      return {
        learners: [],
        stats: {
          totalEnrolled: 0,
          activeEnrolments: 0,
          courseCompletedCount: 0,
          examPassedCount: 0,
          certificatesIssuedCount: 0,
          totalRevenuePaise: 0,
        },
      };
    }

    const userIds = [...new Set(enrolRows.map((r: any) => r.user_id))];
    const orderIds = [
      ...new Set(enrolRows.map((r: any) => r.order_id).filter((id: any) => Boolean(id))),
    ];
    const courseIds = [...new Set(enrolRows.map((r: any) => r.course_id))];

    // 2. Concurrently fetch related data
    const [
      { data: profiles },
      { data: courses },
      { data: orders },
      { data: invoices },
      { data: lessons },
      { data: compulsoryAssignments },
      { data: lessonProgress },
      { data: submissions },
      { data: examAttempts },
      { data: certificates },
    ] = await Promise.all([
      supabase.from("learner_profiles").select("*").in("id", userIds),
      supabase.from("courses").select("id, title").in("id", courseIds),
      orderIds.length
        ? supabase
            .from("orders")
            .select("id, total_amount_paise, status")
            .in("id", orderIds)
        : { data: [] },
      orderIds.length
        ? supabase.from("invoices").select("order_id, invoice_number").in("order_id", orderIds)
        : { data: [] },
      supabase.from("lessons").select("id, course_id:modules(course_id)").eq("is_published", true),
      supabase
        .from("assignments")
        .select("id, course_id")
        .eq("is_compulsory", true)
        .eq("is_published", true),
      supabase
        .from("lesson_progress")
        .select("user_id, lesson_id, is_complete")
        .in("user_id", userIds)
        .eq("is_complete", true),
      supabase
        .from("submissions")
        .select("id, user_id, status")
        .in("user_id", userIds),
      supabase
        .from("exam_attempts")
        .select("id, user_id, score_percent, is_passed, status")
        .in("user_id", userIds),
      supabase.from("certificates").select("*").in("user_id", userIds),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c.title]));
    const orderMap = new Map((orders ?? []).map((o: any) => [o.id, o]));
    const invoiceMap = new Map((invoices ?? []).map((inv: any) => [inv.order_id, inv.invoice_number]));
    const certByUser = new Map((certificates ?? []).map((c: any) => [c.user_id, c]));

    // Total lessons count
    const totalLessonsCount = (lessons ?? []).length;
    const totalCompulsoryAssignmentsCount = (compulsoryAssignments ?? []).length;

    // Completed lessons per user
    const completedLessonsByUser = new Map<string, number>();
    for (const lp of lessonProgress ?? []) {
      completedLessonsByUser.set(lp.user_id, (completedLessonsByUser.get(lp.user_id) ?? 0) + 1);
    }

    // Submissions per user
    const submissionsByUser = new Map<string, { submitted: number; approved: number }>();
    for (const s of submissions ?? []) {
      const cur = submissionsByUser.get(s.user_id) ?? { submitted: 0, approved: 0 };
      cur.submitted += 1;
      if (s.status === "approved") cur.approved += 1;
      submissionsByUser.set(s.user_id, cur);
    }

    // Exam attempts per user
    const examAttemptsByUser = new Map<
      string,
      { count: number; bestScore: number | null; passed: boolean }
    >();
    for (const ea of examAttempts ?? []) {
      const cur = examAttemptsByUser.get(ea.user_id) ?? { count: 0, bestScore: null, passed: false };
      cur.count += 1;
      if (ea.score_percent !== null && (cur.bestScore === null || ea.score_percent > cur.bestScore)) {
        cur.bestScore = ea.score_percent;
      }
      if (ea.is_passed) cur.passed = true;
      examAttemptsByUser.set(ea.user_id, cur);
    }

    let activeEnrolmentsCount = 0;
    let courseCompletedTotal = 0;
    let examPassedTotal = 0;
    let certsIssuedTotal = 0;
    let totalRevenuePaise = 0;

    const learners: EnrolledLearnerSummary[] = enrolRows.map((enrol: any) => {
      const profile = profileMap.get(enrol.user_id) as any;
      const order = enrol.order_id ? (orderMap.get(enrol.order_id) as any) : null;
      const invoiceNumber = enrol.order_id ? invoiceMap.get(enrol.order_id) ?? null : null;
      const cert = certByUser.get(enrol.user_id) as any;

      if (enrol.is_active) activeEnrolmentsCount += 1;
      if (order?.status === "paid" && order.total_amount_paise) {
        totalRevenuePaise += order.total_amount_paise;
      }
      if (cert?.status === "active") certsIssuedTotal += 1;

      const completedLessons = completedLessonsByUser.get(enrol.user_id) ?? 0;
      const progressPercent =
        totalLessonsCount > 0 ? Math.min(100, Math.round((completedLessons / totalLessonsCount) * 100)) : 0;
      if (progressPercent >= 100) courseCompletedTotal += 1;

      const subData = submissionsByUser.get(enrol.user_id) ?? { submitted: 0, approved: 0 };
      const examData = examAttemptsByUser.get(enrol.user_id) ?? {
        count: 0,
        bestScore: null,
        passed: false,
      };
      if (examData.passed) examPassedTotal += 1;

      return {
        id: enrol.id,
        userId: enrol.user_id,
        courseId: enrol.course_id,
        courseTitle: courseMap.get(enrol.course_id) ?? "Authorised Business Broker (ABB)",
        enrolledAt: enrol.enrolled_at,
        validUntil: enrol.valid_until,
        isActive: enrol.is_active,
        source: enrol.source ?? "purchase",

        fullName: profile?.full_name || "Unnamed Learner",
        email: profile?.email || "—",
        mobile: profile?.mobile || null,
        certificateName: profile?.certificate_name || null,
        city: profile?.city || null,
        state: profile?.state || null,
        profession: profile?.profession || null,
        organisation: profile?.organisation || null,
        registeredAt: profile?.created_at || enrol.enrolled_at,

        orderId: enrol.order_id,
        orderTotalPaise: order?.total_amount_paise ?? null,
        orderStatus: order?.status ?? null,
        invoiceNumber,

        lessonsCompletedCount: completedLessons,
        totalLessonsCount,
        progressPercent,

        assignmentsSubmittedCount: subData.submitted,
        assignmentsApprovedCount: subData.approved,
        totalCompulsoryAssignments: totalCompulsoryAssignmentsCount,

        examAttemptsCount: examData.count,
        bestScorePercent: examData.bestScore,
        hasPassedExam: examData.passed,

        certificateStatus: cert?.status ?? null,
        abbId: cert?.abb_id ?? null,
        certificateIssuedAt: cert?.issued_at ?? null,
      };
    });

    return {
      learners,
      stats: {
        totalEnrolled: learners.length,
        activeEnrolments: activeEnrolmentsCount,
        courseCompletedCount: courseCompletedTotal,
        examPassedCount: examPassedTotal,
        certificatesIssuedCount: certsIssuedTotal,
        totalRevenuePaise,
      },
    };
  });

export const getAdminLearnerDetails = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<LearnerFullDetails | null> => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const targetUserId = data.userId;

    // Fetch profile
    const { data: profile } = await supabase
      .from("learner_profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!profile) return null;

    // Fetch enrolment
    const { data: enrolment } = await supabase
      .from("enrolments")
      .select("*")
      .eq("user_id", targetUserId)
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch order & invoice
    const orderId = enrolment?.order_id;
    const { data: order } = orderId
      ? await supabase.from("orders").select("*").eq("id", orderId).maybeSingle()
      : { data: null };
    const { data: invoice } = orderId
      ? await supabase.from("invoices").select("invoice_number").eq("order_id", orderId).maybeSingle()
      : { data: null };

    // Fetch submissions with assignment titles
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, status, marks_awarded, submitted_at, assignments(title)")
      .eq("user_id", targetUserId)
      .order("submitted_at", { ascending: false });

    // Fetch latest feedback from submission_reviews
    const subIds = (submissions ?? []).map((s: any) => s.id);
    const { data: reviews } = subIds.length
      ? await supabase
          .from("submission_reviews")
          .select("submission_id, feedback")
          .in("submission_id", subIds)
          .order("created_at", { ascending: false })
      : { data: [] };
    const reviewFeedbackMap = new Map((reviews ?? []).map((r: any) => [r.submission_id, r.feedback]));

    // Fetch exam attempts
    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("id, attempt_number, status, score_percent, is_passed, started_at, ended_at")
      .eq("user_id", targetUserId)
      .order("attempt_number", { ascending: false });

    // Fetch recent lessons completed
    const { data: lessonProgress } = await supabase
      .from("lesson_progress")
      .select("completed_at, watched_seconds, lessons(title)")
      .eq("user_id", targetUserId)
      .order("completed_at", { ascending: false })
      .limit(10);

    // Fetch total published lessons
    const { count: totalLessons } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);

    const { count: completedCount } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("is_complete", true);

    const { data: cert } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const completed = completedCount ?? 0;
    const total = totalLessons ?? 50;
    const progressPercent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    const bestAttempt = (attempts ?? []).reduce(
      (best: number | null, a: any) =>
        a.score_percent !== null && (best === null || a.score_percent > best) ? a.score_percent : best,
      null,
    );
    const hasPassed = (attempts ?? []).some((a: any) => a.is_passed);

    const approvedSubmissions = (submissions ?? []).filter((s: any) => s.status === "approved").length;

    const summary: EnrolledLearnerSummary = {
      id: enrolment?.id ?? targetUserId,
      userId: targetUserId,
      courseId: enrolment?.course_id ?? "",
      courseTitle: "Authorised Business Broker (ABB)",
      enrolledAt: enrolment?.enrolled_at ?? profile.created_at,
      validUntil: enrolment?.valid_until ?? null,
      isActive: enrolment?.is_active ?? true,
      source: enrolment?.source ?? "purchase",

      fullName: profile.full_name || "Unnamed Learner",
      email: profile.email,
      mobile: profile.mobile,
      certificateName: profile.certificate_name,
      city: profile.city,
      state: profile.state,
      profession: profile.profession,
      organisation: profile.organisation,
      registeredAt: profile.created_at,

      orderId: order?.id ?? null,
      orderTotalPaise: order?.total_amount_paise ?? null,
      orderStatus: order?.status ?? null,
      invoiceNumber: invoice?.invoice_number ?? null,

      lessonsCompletedCount: completed,
      totalLessonsCount: total,
      progressPercent,

      assignmentsSubmittedCount: (submissions ?? []).length,
      assignmentsApprovedCount: approvedSubmissions,
      totalCompulsoryAssignments: 10,

      examAttemptsCount: (attempts ?? []).length,
      bestScorePercent: bestAttempt,
      hasPassedExam: hasPassed,

      certificateStatus: cert?.status ?? null,
      abbId: cert?.abb_id ?? null,
      certificateIssuedAt: cert?.issued_at ?? null,
    };

    return {
      summary,
      profile: {
        billingAddress: profile.billing_address,
        billingCity: profile.billing_city,
        billingState: profile.billing_state,
        billingPincode: profile.billing_pincode,
        education: profile.education,
        gstNumber: profile.gst_number,
        identityProofPath: profile.identity_proof_path,
        photographPath: profile.photograph_path,
      },
      submissions: (submissions ?? []).map((s: any) => ({
        id: s.id,
        assignmentTitle: s.assignments?.title ?? "Assignment",
        status: s.status,
        marksAwarded: s.marks_awarded,
        submittedAt: s.submitted_at,
        reviewerFeedback: reviewFeedbackMap.get(s.id) ?? null,
      })),
      examAttempts: (attempts ?? []).map((a: any) => ({
        id: a.id,
        attemptNumber: a.attempt_number,
        status: a.status,
        scorePercent: a.score_percent,
        isPassed: a.is_passed,
        startedAt: a.started_at,
        endedAt: a.ended_at,
      })),
      recentLessons: (lessonProgress ?? []).map((lp: any) => ({
        lessonTitle: lp.lessons?.title ?? "Lesson",
        completedAt: lp.completed_at,
        watchedSeconds: lp.watched_seconds ?? 0,
      })),
    };
  });
