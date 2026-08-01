import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Plus,
  MessageSquare,
  ChevronLeft,
  Send,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getLearnerTickets,
  createSupportTicket,
  getTicketDetails,
  sendTicketMessage,
  type SupportTicket,
  type TicketMessage,
} from "@/lib/tickets.functions";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({
    meta: [
      { title: "Support | ABB Certification Programme" },
      { name: "description", content: "Raise a support ticket and track its status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const fetchTickets = useServerFn(getLearnerTickets);
  const createTicketFn = useServerFn(createSupportTicket);
  const queryClient = useQueryClient();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => fetchTickets({}),
  });

  const createTicket = useMutation({
    mutationFn: (payload: { subject: string; category: string; priority: string; description: string }) =>
      createTicketFn({ data: payload }),
    onSuccess: (newTicket) => {
      toast.success(`Ticket ${newTicket.ticketNumber} created successfully!`);
      setShowCreateModal(false);
      // Reset form
      setSubject("");
      setCategory("technical");
      setPriority("medium");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setSelectedTicketId(newTicket.id);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create support ticket");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createTicket.mutate({ subject, category, priority, description });
  };

  if (isLoading) {
    return (
      <AppShell title="Support">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Support">
      <div className="max-w-4xl mx-auto space-y-6">
        {selectedTicketId ? (
          <TicketDetailView
            ticketId={selectedTicketId}
            onBack={() => {
              setSelectedTicketId(null);
              queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            }}
          />
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">Support</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Raise a support ticket and track its resolution progress.
                </p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="size-4" /> Raise Ticket
              </Button>
            </header>

            {tickets && tickets.length > 0 ? (
              <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-soft">
                <div className="divide-y divide-border">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-primary/70 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            {ticket.category}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground mt-1">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(ticket.updatedAt).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start md:self-auto">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border uppercase tracking-wider ${
                            ticket.priority === "high"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : ticket.priority === "medium"
                                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}
                        >
                          {ticket.priority}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${
                            ticket.status === "open"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : ticket.status === "in_progress"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {ticket.status === "in_progress" ? "In Progress" : ticket.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
                <MessageSquare className="size-8 mx-auto text-muted-foreground opacity-60" />
                <h3 className="mt-4 text-base font-semibold">No active tickets</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  If you have any queries regarding course content, billing, or certificates, open a ticket.
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="mt-6">
                  Raise your first ticket
                </Button>
              </div>
            )}
          </>
        )}

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="size-5 text-primary" /> Raise Support Ticket
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} className="h-8 w-8 p-0 rounded-full">
                  &times;
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your query"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Enrolment</option>
                      <option value="learning">Course Content</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description / Details <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about your query..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTicket.isPending}>
                    {createTicket.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TicketDetailView({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const fetchDetails = useServerFn(getTicketDetails);
  const sendMessageFn = useServerFn(sendTicketMessage);
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ticket-details", ticketId],
    queryFn: () => fetchDetails({ data: { ticketId } }),
  });

  const postMessage = useMutation({
    mutationFn: (body: string) => sendMessageFn({ data: { ticketId, body } }),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["ticket-details", ticketId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    postMessage.mutate(replyText);
  };

  const ticket = data?.ticket;
  const messages = data?.messages || [];

  if (isLoading || !ticket) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-border pb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-primary/70 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
              {ticket.ticketNumber}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {ticket.category}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold border capitalize ${
                ticket.status === "open"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : ticket.status === "in_progress"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {ticket.status}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-foreground">{ticket.subject}</h2>
        </div>
      </header>

      {/* Main chat thread */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          {/* Thread messages */}
          <div className="space-y-4">
            {/* Original issue description */}
            <div className="flex items-start gap-3 bg-muted/20 border border-border p-5 rounded-2xl">
              <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                You
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-semibold text-foreground">Original Description</strong>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 p-5 rounded-2xl border ${
                  msg.isStaffReply
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border"
                }`}
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    msg.isStaffReply
                      ? "bg-accent/20 text-accent"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {msg.isStaffReply ? "Staff" : "You"}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-sm font-semibold text-foreground">
                      {msg.isStaffReply ? "Support Agent" : "Learner"}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply form */}
          {ticket.status !== "closed" ? (
            <form onSubmit={handleSend} className="space-y-3 bg-muted/10 border border-border p-4 rounded-2xl">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response reply here..."
                rows={3}
                required
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={postMessage.isPending || !replyText.trim()}>
                  {postMessage.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
                  Send Reply
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl bg-muted/40 border border-border p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4 text-success" /> This ticket has been resolved and closed.
            </div>
          )}
        </div>

        {/* Sidebar ticket info */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-soft">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ticket Details</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Ticket Number</span>
              <strong className="font-mono">{ticket.ticketNumber}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Category</span>
              <span className="capitalize font-semibold">{ticket.category}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Priority</span>
              <span className="capitalize font-semibold">{ticket.priority}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Created At</span>
              <span>{new Date(ticket.createdAt).toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Last Updated</span>
              <span>{new Date(ticket.updatedAt).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
