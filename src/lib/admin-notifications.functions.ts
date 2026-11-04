import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readBool, readSetting, type SettingsMap } from "@/domain/settings";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.includes("content_admin") || roles.includes("super_admin");
  if (!ok) throw new Error("Forbidden: admin access required");
}

export type AdminNotificationTemplate = {
  key: string;
  label: string;
  subject: string;
  body: string;
  isEnabled: boolean;
  updatedAt: string;
};

export type NotificationLogItem = {
  id: string;
  action: string;
  recipientEmail: string;
  recipientType: string;
  subject: string;
  templateKey: string;
  status: "sent" | "simulated" | "failed";
  reason: string | null;
  createdAt: string;
};

export type NotificationAdminData = {
  templates: AdminNotificationTemplate[];
  settings: {
    notificationsEnabled: boolean;
    adminNotificationEmail: string;
    notificationFromName: string;
    notificationFromEmail: string;
  };
  isApiKeyConfigured: boolean;
  recentLogs: NotificationLogItem[];
};

export const getAdminNotificationData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotificationAdminData> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch templates
    const { data: templatesData, error: tErr } = await supabaseAdmin
      .from("notification_templates")
      .select("key, label, subject, body, is_enabled, updated_at")
      .order("label", { ascending: true });

    if (tErr) throw new Error(`Failed to load templates: ${tErr.message}`);

    const templates: AdminNotificationTemplate[] = (templatesData ?? []).map((t: any) => ({
      key: t.key,
      label: t.label,
      subject: t.subject,
      body: t.body,
      isEnabled: t.is_enabled,
      updatedAt: t.updated_at,
    }));

    // 2. Fetch platform settings
    const { data: settingsData } = await supabaseAdmin.from("settings").select("key, value");
    const settingsMap: SettingsMap = {};
    for (const row of settingsData ?? []) settingsMap[row.key] = row.value as SettingsMap[string];

    const settings = {
      notificationsEnabled: readBool(settingsMap, "notifications_enabled"),
      adminNotificationEmail: String(readSetting(settingsMap, "admin_notification_email") || "info@ybbindia.com"),
      notificationFromName: String(readSetting(settingsMap, "notification_from_name") || "Yoova Business Broking"),
      notificationFromEmail: String(readSetting(settingsMap, "notification_from_email") || "info@ybbindia.com"),
    };

    // 3. Check Resend API key status
    const isApiKeyConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);

    // 4. Fetch recent logs from audit_logs
    const { data: logsData } = await supabaseAdmin
      .from("audit_logs")
      .select("id, action, actor_email, reason, metadata, created_at")
      .eq("entity_type", "notification")
      .order("created_at", { ascending: false })
      .limit(50);

    const recentLogs: NotificationLogItem[] = (logsData ?? []).map((log: any) => {
      const meta = (log.metadata as Record<string, any>) || {};
      let status: "sent" | "simulated" | "failed" = "sent";
      if (log.action === "notification.simulated" || meta.status === "simulated") status = "simulated";
      else if (log.action === "notification.failed" || meta.status === "failed") status = "failed";

      return {
        id: log.id,
        action: log.action,
        recipientEmail: log.actor_email || meta.recipientEmail || "—",
        recipientType: meta.recipientType || "unknown",
        subject: meta.subject || log.reason || "—",
        templateKey: meta.templateKey || "unknown",
        status,
        reason: log.reason,
        createdAt: log.created_at,
      };
    });

    return {
      templates,
      settings,
      isApiKeyConfigured,
      recentLogs,
    };
  });

export const updateNotificationTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      key: string;
      subject?: string;
      body?: string;
      isEnabled?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updates: {
      subject?: string;
      body?: string;
      is_enabled?: boolean;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };
    if (data.subject !== undefined) updates.subject = data.subject;
    if (data.body !== undefined) updates.body = data.body;
    if (data.isEnabled !== undefined) updates.is_enabled = data.isEnabled;

    const { error } = await supabaseAdmin
      .from("notification_templates")
      .update(updates)
      .eq("key", data.key);

    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const updateNotificationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      notificationsEnabled?: boolean;
      adminNotificationEmail?: string;
      notificationFromName?: string;
      notificationFromEmail?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updates: Array<{ key: string; value: any; updated_by: string; updated_at: string }> = [];
    const now = new Date().toISOString();

    if (data.notificationsEnabled !== undefined) {
      updates.push({
        key: "notifications_enabled",
        value: data.notificationsEnabled,
        updated_by: context.userId,
        updated_at: now,
      });
    }

    if (data.adminNotificationEmail !== undefined) {
      updates.push({
        key: "admin_notification_email",
        value: data.adminNotificationEmail,
        updated_by: context.userId,
        updated_at: now,
      });
    }

    if (data.notificationFromName !== undefined) {
      updates.push({
        key: "notification_from_name",
        value: data.notificationFromName,
        updated_by: context.userId,
        updated_at: now,
      });
    }

    if (data.notificationFromEmail !== undefined) {
      updates.push({
        key: "notification_from_email",
        value: data.notificationFromEmail,
        updated_by: context.userId,
        updated_at: now,
      });
    }

    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from("settings")
        .update({ value: update.value, updated_by: update.updated_by, updated_at: update.updated_at })
        .eq("key", update.key);

      if (error) throw new Error(`Failed to update ${update.key}: ${error.message}`);
    }

    return { ok: true };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      recipientEmail: string;
      subject?: string;
      body?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { sendDirectTestEmail } = await import("@/lib/notifications.server");

    const subject = data.subject || "YBB India: Test Notification Delivery";
    const body =
      data.body ||
      `This is a test notification from the YBB Admin Portal.\n\nIf you are reading this email, your notification configuration and email delivery pipeline are functioning properly!`;

    const result = await sendDirectTestEmail({
      recipientEmail: data.recipientEmail,
      subject,
      body,
    });

    if (!result.success && result.status !== "simulated") {
      throw new Error(result.error || "Failed to deliver test email");
    }

    return result;
  });

export const sendTemplateTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      templateKey: string;
      recipientEmail: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { sendNotification } = await import("@/lib/notifications.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const sampleVars: Record<string, any> = {
      order_confirmed_customer: {
        learner_name: "Pranav Patil",
        order_id: "ORD-DEMO12",
        amount: "₹1,999",
        invoice_number: "YBB/ABB/0019",
        valid_until: "Nov 4, 2027",
      },
      order_created_admin: {
        learner_name: "Pranav Patil",
        learner_email: data.recipientEmail,
        learner_mobile: "+91 98765 43210",
        order_id: "ORD-DEMO12",
        amount: "₹1,999",
        invoice_number: "YBB/ABB/0019",
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      },
      assignment_submitted_customer: {
        learner_name: "Pranav Patil",
        assignment_title: "Spot One Saleable Business",
      },
      assignment_submitted_admin: {
        learner_name: "Pranav Patil",
        learner_email: data.recipientEmail,
        assignment_title: "Spot One Saleable Business",
        lesson_title: "Lesson 1: What is Business Broking?",
        submitted_at: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      },
      assignment_reviewed_customer: {
        learner_name: "Pranav Patil",
        assignment_title: "Spot One Saleable Business",
        review_status: "Approved",
        reviewer_notes: "Excellent market breakdown and clear justification for the buyer persona. Well done!",
      },
      certificate_issued_customer: {
        learner_name: "Pranav Patil",
        abb_id: "YBB-ABB-2026-0042",
        issue_date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      },
      certificate_issued_admin: {
        learner_name: "Pranav Patil",
        learner_email: data.recipientEmail,
        abb_id: "YBB-ABB-2026-0042",
        issue_date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      },
      ticket_created_admin: {
        ticket_number: "TKT-104829",
        learner_name: "Pranav Patil",
        learner_email: data.recipientEmail,
        category: "Course Curriculum",
        priority: "High",
        ticket_subject: "Question regarding Module 4 valuation models",
        ticket_description: "Could you please explain how to adjust owner salary in the EBITDA multiple calculation?",
      },
      ticket_reply_customer: {
        learner_name: "Pranav Patil",
        ticket_number: "TKT-104829",
        ticket_subject: "Question regarding Module 4 valuation models",
        reply_message: "Hello Pranav, the owner salary adjustment of ₹12L has been factored into the recalculated EBITDA. Please review lesson 22 materials.",
      },
    };

    const variables = sampleVars[data.templateKey] || { learner_name: "Learner" };

    const result = await sendNotification({
      templateKey: data.templateKey,
      recipientEmail: data.recipientEmail,
      recipientType: data.templateKey.includes("_admin") ? "admin" : "customer",
      variables,
      actorId: context.userId,
      supabaseAdmin,
      metadata: { isSampleTest: true },
    });

    if (!result.success && result.status !== "simulated") {
      throw new Error(result.error || `Failed to send sample for ${data.templateKey}`);
    }

    return result;
  });
