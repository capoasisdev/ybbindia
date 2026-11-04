import { readBool, readSetting, type SettingsMap } from "@/domain/settings";

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export type NotificationVariableMap = Record<string, string | number | boolean | null | undefined>;

export type SendNotificationOptions = {
  templateKey: string;
  recipientEmail: string;
  recipientType: "customer" | "admin";
  variables?: NotificationVariableMap;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  supabaseAdmin?: AdminClient;
};

export type NotificationResult = {
  success: boolean;
  status: "sent" | "simulated" | "failed" | "skipped";
  templateKey: string;
  recipientEmail: string;
  subject?: string;
  error?: string;
};

/**
 * Replaces {{placeholder}} tokens with provided variable values.
 */
function interpolate(template: string, variables: NotificationVariableMap): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

/**
 * Builds a styled HTML wrapper for the email body matching YBB branding.
 */
function buildHtmlEmail(subject: string, textBody: string, programmeName: string): string {
  const formattedParagraphs = textBody
    .split("\n\n")
    .map((block) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #1e293b; font-size: 15px;">${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; display: inline-block;">
                YOOVA <span style="color: #38bdf8;">BUSINESS BROKING</span>
              </span>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${escapeHtml(programmeName)}
              </div>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              ${formattedParagraphs}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Yoova Business Broking Pvt Ltd</p>
              <p style="margin: 0 0 6px 0;">Nashik, Maharashtra, India | <a href="https://www.ybbindia.com" style="color: #0284c7; text-decoration: none;">www.ybbindia.com</a></p>
              <p style="margin: 0; color: #94a3b8;">This is an automated system notification regarding your YBB account.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Loads platform settings map.
 */
async function loadPlatformSettings(supabaseAdmin: AdminClient): Promise<SettingsMap> {
  const { data } = await supabaseAdmin.from("settings").select("key, value");
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value as SettingsMap[string];
  return map;
}

/**
 * Dispatches an automated email using Resend, or records a simulation log if API key is not yet set.
 */
export async function sendNotification(options: SendNotificationOptions): Promise<NotificationResult> {
  const {
    templateKey,
    recipientEmail,
    recipientType,
    variables = {},
    actorId = null,
    metadata = {},
  } = options;

  let supabaseAdmin = options.supabaseAdmin;
  if (!supabaseAdmin) {
    const serverModule = await import("@/integrations/supabase/client.server");
    supabaseAdmin = serverModule.supabaseAdmin;
  }

  try {
    // 1. Check global notifications setting
    const settings = await loadPlatformSettings(supabaseAdmin);
    const notificationsEnabled = readBool(settings, "notifications_enabled");
    if (!notificationsEnabled) {
      return {
        success: true,
        status: "skipped",
        templateKey,
        recipientEmail,
        error: "Notifications are globally disabled in platform settings.",
      };
    }

    // 2. Fetch template from DB
    const { data: template, error: tErr } = await supabaseAdmin
      .from("notification_templates")
      .select("key, label, subject, body, is_enabled")
      .eq("key", templateKey)
      .maybeSingle();

    if (tErr) {
      console.error(`[Notification] Error fetching template ${templateKey}:`, tErr);
      return {
        success: false,
        status: "failed",
        templateKey,
        recipientEmail,
        error: `Database error: ${tErr.message}`,
      };
    }

    if (!template) {
      console.warn(`[Notification] Template ${templateKey} not found.`);
      return {
        success: false,
        status: "skipped",
        templateKey,
        recipientEmail,
        error: `Template ${templateKey} does not exist.`,
      };
    }

    if (!template.is_enabled) {
      return {
        success: true,
        status: "skipped",
        templateKey,
        recipientEmail,
        error: `Template ${templateKey} is turned off in Admin settings.`,
      };
    }

    // 3. Interpolate tokens
    const programmeName = String(readSetting(settings, "programme_name") || "ABB Certification Programme");
    const mergedVariables: NotificationVariableMap = {
      programme_name: programmeName,
      ...variables,
    };

    const finalSubject = interpolate(template.subject, mergedVariables);
    const finalText = interpolate(template.body, mergedVariables);
    const finalHtml = buildHtmlEmail(finalSubject, finalText, programmeName);

    const fromName = String(readSetting(settings, "notification_from_name") || "Yoova Business Broking");
    const fromEmailConfig = String(readSetting(settings, "notification_from_email") || "info@ybbindia.com");
    
    // Resend configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const isApiKeyConfigured = Boolean(resendApiKey && resendApiKey.trim().length > 0);

    // If no key is set, we simulate gracefully
    if (!isApiKeyConfigured) {
      console.log(`[Notification SIMULATED] Key: ${templateKey} | To: ${recipientEmail} | Subject: "${finalSubject}"`);

      await supabaseAdmin.from("audit_logs").insert({
        actor_id: actorId,
        actor_email: recipientEmail,
        action: "notification.simulated",
        entity_type: "notification",
        entity_id: templateKey,
        reason: "Simulated delivery (RESEND_API_KEY not configured in environment)",
        metadata: {
          templateKey,
          recipientEmail,
          recipientType,
          subject: finalSubject,
          channel: "email",
          status: "simulated",
          variables: mergedVariables,
          ...metadata,
        } as never,
      });

      return {
        success: true,
        status: "simulated",
        templateKey,
        recipientEmail,
        subject: finalSubject,
      };
    }

    // 4. Send via Resend REST API
    // If the sender domain is not verified, Resend permits onboarding@resend.dev for testing.
    // Try sending with fromEmailConfig, fallback if Resend rejects unverified domain.
    const sender = `${fromName} <${fromEmailConfig}>`;

    const resendPayload = {
      from: sender,
      to: [recipientEmail],
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
    };

    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(resendPayload),
    });

    let resendJson: any = null;
    try {
      resendJson = await resendRes.json();
    } catch {
      // response might not be json
    }

    // Handle domain verification error by testing with onboarding@resend.dev fallback
    if (!resendRes.ok && resendJson?.message?.includes("domain") && !sender.includes("onboarding@resend.dev")) {
      console.warn(`[Notification] Custom domain unverified, attempting delivery via onboarding@resend.dev:`, resendJson?.message);
      resendPayload.from = `Yoova Business Broking <onboarding@resend.dev>`;
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(resendPayload),
      });
      try {
        resendJson = await resendRes.json();
      } catch {}
    }

    if (!resendRes.ok) {
      const errMessage = resendJson?.message || `Resend API error status ${resendRes.status}`;
      console.error(`[Notification FAILED] Key: ${templateKey} | To: ${recipientEmail}:`, errMessage);

      await supabaseAdmin.from("audit_logs").insert({
        actor_id: actorId,
        actor_email: recipientEmail,
        action: "notification.failed",
        entity_type: "notification",
        entity_id: templateKey,
        reason: errMessage,
        metadata: {
          templateKey,
          recipientEmail,
          recipientType,
          subject: finalSubject,
          channel: "email",
          status: "failed",
          error: errMessage,
          ...metadata,
        } as never,
      });

      return {
        success: false,
        status: "failed",
        templateKey,
        recipientEmail,
        subject: finalSubject,
        error: errMessage,
      };
    }

    // Success!
    console.log(`[Notification SENT] Key: ${templateKey} | To: ${recipientEmail} | ID: ${resendJson?.id}`);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: actorId,
      actor_email: recipientEmail,
      action: "notification.sent",
      entity_type: "notification",
      entity_id: templateKey,
      reason: `Sent successfully (Provider ID: ${resendJson?.id ?? "ok"})`,
      metadata: {
        templateKey,
        recipientEmail,
        recipientType,
        subject: finalSubject,
        channel: "email",
        status: "sent",
        resendMessageId: resendJson?.id,
        ...metadata,
      } as never,
    });

    return {
      success: true,
      status: "sent",
      templateKey,
      recipientEmail,
      subject: finalSubject,
    };
  } catch (err: any) {
    console.error(`[Notification Exception] Key: ${templateKey} | To: ${recipientEmail}:`, err);
    return {
      success: false,
      status: "failed",
      templateKey,
      recipientEmail,
      error: err?.message || String(err),
    };
  }
}

/**
 * Sends a direct test email (not bound to a database template).
 */
export async function sendDirectTestEmail(options: {
  recipientEmail: string;
  subject: string;
  body: string;
}): Promise<NotificationResult> {
  const { recipientEmail, subject, body } = options;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const settings = await loadPlatformSettings(supabaseAdmin);
  const programmeName = String(readSetting(settings, "programme_name") || "ABB Certification Programme");

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      success: false,
      status: "simulated",
      templateKey: "test_email",
      recipientEmail,
      subject,
      error: "RESEND_API_KEY environment variable is not configured on the server.",
    };
  }

  const fromName = String(readSetting(settings, "notification_from_name") || "Yoova Business Broking");
  const fromEmailConfig = String(readSetting(settings, "notification_from_email") || "info@ybbindia.com");
  const html = buildHtmlEmail(subject, body, programmeName);

  let sender = `${fromName} <${fromEmailConfig}>`;
  let res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: sender,
      to: [recipientEmail],
      subject,
      html,
      text: body,
    }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok && data?.message?.includes("domain") && !sender.includes("onboarding@resend.dev")) {
    sender = `Yoova Business Broking <onboarding@resend.dev>`;
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: sender,
        to: [recipientEmail],
        subject,
        html,
        text: body,
      }),
    });
    try {
      data = await res.json();
    } catch {}
  }

  if (!res.ok) {
    const errorMsg = data?.message || `HTTP error ${res.status}`;
    await supabaseAdmin.from("audit_logs").insert({
      actor_email: recipientEmail,
      action: "notification.failed",
      entity_type: "notification",
      entity_id: "test_email",
      reason: errorMsg,
      metadata: { recipientEmail, subject, status: "failed", error: errorMsg } as never,
    });
    return {
      success: false,
      status: "failed",
      templateKey: "test_email",
      recipientEmail,
      subject,
      error: errorMsg,
    };
  }

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: recipientEmail,
    action: "notification.sent",
    entity_type: "notification",
    entity_id: "test_email",
    reason: `Test email sent (ID: ${data?.id ?? "ok"})`,
    metadata: { recipientEmail, subject, status: "sent", resendId: data?.id } as never,
  });

  return {
    success: true,
    status: "sent",
    templateKey: "test_email",
    recipientEmail,
    subject,
  };
}

