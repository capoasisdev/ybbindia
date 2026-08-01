import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: "open" | "in_progress" | "waiting_for_learner" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isStaffReply: boolean;
  createdAt: string;
};

export const getLearnerTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportTicket[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, description, category, priority, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((t: any) => ({
      id: t.id,
      ticketNumber: t.ticket_number,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  });

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      subject: string;
      category: string;
      priority: string;
      description: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<SupportTicket> => {
    const { supabase, userId } = context;
    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: insertedData, error: error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        ticket_number: ticketNumber,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "open",
      })
      .select("id, ticket_number, subject, description, category, priority, status, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);

    return {
      id: insertedData.id,
      ticketNumber: insertedData.ticket_number,
      subject: insertedData.subject,
      description: insertedData.description,
      category: insertedData.category,
      priority: insertedData.priority,
      status: insertedData.status,
      createdAt: insertedData.created_at,
      updatedAt: insertedData.updated_at,
    };
  });

export const getTicketDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ticketId: string }) => input)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ticket: SupportTicket; messages: TicketMessage[] }> => {
      const { supabase, userId } = context;

      // 1. Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, description, category, priority, status, created_at, updated_at, user_id")
        .eq("id", data.ticketId)
        .single();

      if (ticketError) throw new Error(ticketError.message);
      if (ticketData.user_id !== userId) throw new Error("Unauthorized access to ticket");

      // 2. Fetch messages
      const { data: msgData, error: msgError } = await supabase
        .from("ticket_messages")
        .select("id, ticket_id, author_id, body, is_staff_reply, created_at")
        .eq("ticket_id", data.ticketId)
        .order("created_at", { ascending: true });

      if (msgError) throw new Error(msgError.message);

      const ticket: SupportTicket = {
        id: ticketData.id,
        ticketNumber: ticketData.ticket_number,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: ticketData.status,
        createdAt: ticketData.created_at,
        updatedAt: ticketData.updated_at,
      };

      const messages: TicketMessage[] = (msgData ?? []).map((m: any) => ({
        id: m.id,
        ticketId: m.ticket_id,
        authorId: m.author_id,
        body: m.body,
        isStaffReply: m.is_staff_reply,
        createdAt: m.created_at,
      }));

      return { ticket, messages };
    },
  );

export const sendTicketMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      ticketId: string;
      body: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<TicketMessage> => {
    const { supabase, userId } = context;

    // Verify ticket ownership first
    const { data: ticketData, error: ticketError } = await supabase
      .from("support_tickets")
      .select("user_id")
      .eq("id", data.ticketId)
      .single();

    if (ticketError) throw new Error(ticketError.message);
    if (ticketData.user_id !== userId) throw new Error("Unauthorized");

    const { data: insertedData, error: error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: data.ticketId,
        author_id: userId,
        body: data.body,
        is_staff_reply: false,
      })
      .select("id, ticket_id, author_id, body, is_staff_reply, created_at")
      .single();

    if (error) throw new Error(error.message);

    // Also update ticket's updated_at timestamp
    await supabase
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.ticketId);

    return {
      id: insertedData.id,
      ticketId: insertedData.ticket_id,
      authorId: insertedData.author_id,
      body: insertedData.body,
      isStaffReply: insertedData.is_staff_reply,
      createdAt: insertedData.created_at,
    };
  });
