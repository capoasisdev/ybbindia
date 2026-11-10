import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export type AdminTicketSummary = {
  id: string;
  ticketNumber: string;
  userId: string;
  learnerName: string;
  learnerEmail: string;
  learnerMobile: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminTicketMessage = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isStaffReply: boolean;
  createdAt: string;
};

export type AdminTicketDetail = {
  ticket: AdminTicketSummary;
  messages: AdminTicketMessage[];
};

async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.some((r: string) =>
    ["super_admin", "content_admin", "support_admin", "reviewer"].includes(r),
  );
  if (!ok) throw new Error("Forbidden: staff access required");
}

/**
 * Loads all support tickets with learner contact details for the admin console.
 */
export const getAdminTicketsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTicketSummary[]> => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tickets, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_number, user_id, category, subject, description, priority, status, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!tickets || tickets.length === 0) return [];

    // Fetch learner profiles for all ticket owners
    const userIds = Array.from(new Set(tickets.map((t) => t.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("learner_profiles")
      .select("id, full_name, email, mobile")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return tickets.map((t) => {
      const p = profileMap.get(t.user_id);
      return {
        id: t.id,
        ticketNumber: t.ticket_number,
        userId: t.user_id,
        learnerName: p?.full_name || "Unknown Learner",
        learnerEmail: p?.email || "—",
        learnerMobile: p?.mobile || "—",
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });
  });

/**
 * Loads full thread history and details for a single ticket.
 */
export const getAdminTicketDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ticketId: string }) => input)
  .handler(async ({ data, context }): Promise<AdminTicketDetail> => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_number, user_id, category, subject, description, priority, status, created_at, updated_at")
      .eq("id", data.ticketId)
      .single();

    if (ticketError) throw new Error(ticketError.message);

    const { data: profile } = await supabaseAdmin
      .from("learner_profiles")
      .select("full_name, email, mobile")
      .eq("id", ticket.user_id)
      .maybeSingle();

    const { data: messages, error: msgError } = await supabaseAdmin
      .from("ticket_messages")
      .select("id, ticket_id, author_id, body, is_staff_reply, created_at")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true });

    if (msgError) throw new Error(msgError.message);

    return {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        userId: ticket.user_id,
        learnerName: profile?.full_name || "Learner",
        learnerEmail: profile?.email || "—",
        learnerMobile: profile?.mobile || "—",
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
      },
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        ticketId: m.ticket_id,
        authorId: m.author_id,
        body: m.body,
        isStaffReply: m.is_staff_reply,
        createdAt: m.created_at,
      })),
    };
  });

/**
 * Admin / Staff replies to a ticket. Dispatches automated email to the learner.
 */
export const adminReplyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      ticketId: string;
      body: string;
      status?: TicketStatus;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch ticket to verify and get learner details
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_number, user_id, subject")
      .eq("id", data.ticketId)
      .single();

    if (ticketError) throw new Error(ticketError.message);

    const now = new Date().toISOString();
    const nextStatus: TicketStatus = data.status || "waiting_for_learner";

    // 2. Insert message
    const { data: insertedMsg, error: insertError } = await supabaseAdmin
      .from("ticket_messages")
      .insert({
        ticket_id: data.ticketId,
        author_id: context.userId,
        body: data.body.trim(),
        is_staff_reply: true,
      })
      .select("id, created_at")
      .single();

    if (insertError) throw new Error(insertError.message);

    // 3. Update ticket status and timestamp
    await supabaseAdmin
      .from("support_tickets")
      .update({
        status: nextStatus,
        updated_at: now,
      })
      .eq("id", data.ticketId);

    // 4. Send automated email notification to the learner
    try {
      const { sendNotification } = await import("@/lib/notifications.server");
      const { data: profile } = await supabaseAdmin
        .from("learner_profiles")
        .select("full_name, email")
        .eq("id", ticket.user_id)
        .maybeSingle();

      if (profile?.email) {
        await sendNotification({
          templateKey: "ticket_reply_customer",
          recipientEmail: profile.email,
          recipientType: "customer",
          variables: {
            learner_name: profile.full_name || "Learner",
            ticket_number: ticket.ticket_number,
            ticket_subject: ticket.subject,
            reply_message: data.body.trim(),
          },
          actorId: context.userId,
          supabaseAdmin,
          metadata: { ticketId: data.ticketId, ticketNumber: ticket.ticket_number },
        });
      }
    } catch (notifErr) {
      console.warn("[Notification] Ticket reply email notification failed gracefully:", notifErr);
    }

    return { ok: true, messageId: insertedMsg.id };
  });

/**
 * Updates ticket status (e.g. resolve or close ticket).
 */
export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      ticketId: string;
      status: TicketStatus;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update({
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.ticketId);

    if (error) throw new Error(error.message);

    return { ok: true };
  });

