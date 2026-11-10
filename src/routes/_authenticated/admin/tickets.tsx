import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  User,
  Tag,
  AlertTriangle,
  RotateCcw,
  Check,
  ExternalLink,
  ChevronRight,
  Filter,
  MessageSquare,
  ShieldAlert,
  Inbox,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getAdminTicketsList,
  getAdminTicketDetails,
  adminReplyToTicket,
  updateTicketStatus,
  type AdminTicketSummary,
  type AdminTicketDetail,
} from "@/lib/admin-tickets.functions";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  head: () => ({
    meta: [
      { title: "Support Tickets | ABB Admin" },
      { name: "description", content: "Review and respond to learner support tickets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTicketsPage,
});

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; badgeClass: string; borderClass: string; bgClass: string; icon: React.ElementType }
> = {
  open: {
    label: "Open",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-50/50",
    icon: AlertCircle,
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-50/50",
    icon: Clock,
  },
  waiting_for_learner: {
    label: "Waiting on Learner",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    borderClass: "border-purple-500/30",
    bgClass: "bg-purple-50/50",
    icon: UserCheck,
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-50/50",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-muted text-muted-foreground border-border",
    borderClass: "border-border",
    bgClass: "bg-muted/20",
    icon: Check,
  },
};

const CATEGORIES: Record<string, string> = {
  all: "All Categories",
  technical: "Technical Issue",
  course_content: "Course Content",
  billing: "Billing & Payment",
  certificate: "Certificate Inquiry",
  examination: "Exam Query",
  other: "Other",
};

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function timeAgo(isoString: string): string {
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function AdminTicketsPage() {
  const queryClient = useQueryClient();
  const fetchTickets = useServerFn(getAdminTicketsList);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: tickets = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-tickets-list"],
    queryFn: () => fetchTickets({}),
  });

  // Calculate high-level summary counters
  const counters = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let waitingCount = 0;
    let resolvedCount = 0;
    let closedCount = 0;

    for (const t of tickets) {
      if (t.status === "open") openCount++;
      else if (t.status === "in_progress") inProgressCount++;
      else if (t.status === "waiting_for_learner") waitingCount++;
      else if (t.status === "resolved") resolvedCount++;
      else if (t.status === "closed") closedCount++;
    }

    return {
      total: tickets.length,
      actionNeeded: openCount + inProgressCount,
      open: openCount,
      inProgress: inProgressCount,
      waiting: waitingCount,
      resolved: resolvedCount,
      closed: closedCount,
    };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && t.category.toLowerCase() !== categoryFilter.toLowerCase())
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = t.ticketNumber.toLowerCase().includes(q);
        const matchesSubject = t.subject.toLowerCase().includes(q);
        const matchesName = t.learnerName.toLowerCase().includes(q);
        const matchesEmail = t.learnerEmail.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesSubject && !matchesName && !matchesEmail && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  // Auto-select first ticket if none selected and filtered tickets exist
  const activeTicket = useMemo(() => {
    if (!tickets.length) return null;
    if (selectedTicketId) {
      const found = tickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return filteredTickets[0] ?? null;
  }, [tickets, selectedTicketId, filteredTickets]);

  return (
    <AppShell title="Support Tickets">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-primary font-bold">Support Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <LifeBuoy className="size-7 text-primary" />
              Support Tickets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage learner inquiries, reply with automatic email dispatch, and track resolution progress.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Action Required
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600">
                {counters.actionNeeded}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              {counters.open} open • {counters.inProgress} in progress
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Waiting on Learner
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-600">
                {counters.waiting}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Staff reply sent, awaiting student response
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Resolved / Closed
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">
                {counters.resolved + counters.closed}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              {counters.resolved} resolved • {counters.closed} closed
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Total Inquiries
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {counters.total}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Lifetime learner tickets
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3.5 rounded-2xl border border-border shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All", count: counters.total },
              { id: "open", label: "Open", count: counters.open },
              { id: "in_progress", label: "In Progress", count: counters.inProgress },
              { id: "waiting_for_learner", label: "Waiting", count: counters.waiting },
              { id: "resolved", label: "Resolved", count: counters.resolved },
              { id: "closed", label: "Closed", count: counters.closed },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Category Dropdown */}
          <div className="flex items-center gap-2 flex-1 lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, name, email, query..."
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Pane Support Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Tickets List */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tickets ({filteredTickets.length})
              </span>
              {(statusFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading support tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center space-y-2">
                <Inbox className="size-8 text-muted-foreground/60 mx-auto" />
                <p className="text-sm font-semibold text-foreground">No tickets match criteria</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {tickets.length === 0
                    ? "No support tickets have been submitted by learners yet."
                    : "Try broadening your search query or switching status filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
                {filteredTickets.map((t) => {
                  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                  const isSelected = activeTicket?.id === t.id;
                  const isUrgent = t.priority === "urgent" || t.priority === "high";

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all text-left relative ${
                        isSelected
                          ? "bg-card border-primary ring-2 ring-primary/20 shadow-sm"
                          : "bg-card border-border hover:border-primary/40 hover:bg-muted/10"
                      }`}
                    >
                      {/* Top row: Ticket # + Category + Time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {t.ticketNumber}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            {CATEGORIES[t.category] || t.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                          {timeAgo(t.updatedAt || t.createdAt)}
                        </span>
                      </div>

                      {/* Subject */}
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
                        {t.subject}
                      </h3>

                      {/* Learner summary */}
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2.5">
                        <span className="font-medium text-foreground">{t.learnerName}</span> •{" "}
                        <span>{t.learnerEmail}</span>
                      </p>

                      {/* Bottom row: Status badge + priority */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}
                        >
                          <cfg.icon className="size-3" />
                          {cfg.label}
                        </span>

                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <AlertTriangle className="size-2.5" />
                            {t.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Pane: Active Ticket Thread & Reply Workspace */}
          <div className="lg:col-span-7 xl:col-span-8">
            {activeTicket ? (
              <ActiveTicketDetailView
                ticketId={activeTicket.id}
                onStatusUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ["admin-tickets-list"] });
                }}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center space-y-3">
                <LifeBuoy className="size-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">No Ticket Selected</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Select a ticket from the left column to view the full message history, review learner contact details, and respond directly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * Detailed viewer for a single support ticket: learner profile, message history, status changes, and staff reply box.
 */
function ActiveTicketDetailView({
  ticketId,
  onStatusUpdated,
}: {
  ticketId: string;
  onStatusUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const fetchDetails = useServerFn(getAdminTicketDetails);
  const replyFn = useServerFn(adminReplyToTicket);
  const updateStatusFn = useServerFn(updateTicketStatus);

  const [replyText, setReplyText] = useState("");
  const [nextStatus, setNextStatus] = useState<TicketStatus>("waiting_for_learner");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-ticket-details", ticketId],
    queryFn: () => fetchDetails({ data: { ticketId } }),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      replyFn({
        data: {
          ticketId,
          body,
          status: nextStatus,
        },
      }),
    onSuccess: () => {
      toast.success("Reply dispatched & learner notified via email!");
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-details", ticketId] });
      onStatusUpdated();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to post reply");
    },
  });

  // Quick Status change mutation
  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) =>
      updateStatusFn({
        data: { ticketId, status },
      }),
    onSuccess: (_, status) => {
      toast.success(`Ticket marked as ${STATUS_CONFIG[status]?.label || status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-details", ticketId] });
      onStatusUpdated();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update ticket status");
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Please enter a reply message.");
      return;
    }
    replyMutation.mutate(replyText);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-16 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Loading ticket conversation...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-2">
        <AlertCircle className="size-6 text-destructive mx-auto" />
        <p className="text-sm font-semibold text-destructive">Failed to load ticket details</p>
        <p className="text-xs text-muted-foreground">{error?.message || "Record not found"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const { ticket, messages } = data;
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;

  return (
    <div className="space-y-4">
      {/* Ticket Header & Status Actions */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-foreground">
                {ticket.ticketNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badgeClass}`}
              >
                <cfg.icon className="size-3" />
                {cfg.label}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {CATEGORIES[ticket.category] || ticket.category}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                Priority: {ticket.priority}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-foreground pt-1">
              {ticket.subject}
            </h2>
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
            {ticket.status !== "in_progress" && ticket.status !== "resolved" && ticket.status !== "closed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate("in_progress")}
                disabled={statusMutation.isPending}
                className="text-xs h-8"
              >
                Mark In Progress
              </Button>
            )}

            {ticket.status !== "resolved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate("resolved")}
                disabled={statusMutation.isPending}
                className="text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                Mark Resolved
              </Button>
            )}

            {ticket.status !== "closed" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => statusMutation.mutate("closed")}
                disabled={statusMutation.isPending}
                className="text-xs h-8 text-muted-foreground"
              >
                Close Ticket
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate("open")}
                disabled={statusMutation.isPending}
                className="text-xs h-8 gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Reopen Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Learner Profile Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                Learner
              </span>
              <span className="font-semibold text-foreground">{ticket.learnerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                Email Address
              </span>
              <a
                href={`mailto:${ticket.learnerEmail}`}
                className="text-primary hover:underline font-medium break-all"
              >
                {ticket.learnerEmail}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="size-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                Phone
              </span>
              {ticket.learnerMobile && ticket.learnerMobile !== "—" ? (
                <a
                  href={`tel:${ticket.learnerMobile}`}
                  className="text-foreground hover:underline font-medium"
                >
                  {ticket.learnerMobile}
                </a>
              ) : (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            Conversation History ({messages.length + 1} messages)
          </span>
          <span className="text-[11px] text-muted-foreground">
            Opened on {formatDateTime(ticket.createdAt)}
          </span>
        </div>

        {/* Initial inquiry from learner */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {ticket.learnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {ticket.learnerName}
                </span>
                <span className="text-[10px] text-muted-foreground">Original Inquiry</span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(ticket.createdAt)}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>

        {/* Subsequent replies */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
              m.isStaffReply
                ? "bg-primary/[0.04] border-primary/25 ml-4 sm:ml-8"
                : "bg-card border-border mr-4 sm:mr-8"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`size-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    m.isStaffReply
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.isStaffReply ? "YBB" : ticket.learnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    {m.isStaffReply ? "YBB Support Team (Staff)" : ticket.learnerName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {m.isStaffReply ? "Official Staff Reply" : "Learner Reply"}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {formatDateTime(m.createdAt)}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {/* Staff Reply Composer */}
      {ticket.status === "closed" ? (
        <div className="rounded-2xl border border-border bg-muted/30 p-5 text-center space-y-2">
          <CheckCircle2 className="size-6 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">This ticket is closed</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            To reply or re-engage with this inquiry, reopen the ticket first.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => statusMutation.mutate("open")}
            disabled={statusMutation.isPending}
            className="text-xs mt-2"
          >
            Reopen Ticket
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSendReply}
          className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Send className="size-3.5 text-primary" />
              Reply as Support Staff
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Set status after reply:</span>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as TicketStatus)}
                className="h-8 px-2 text-xs rounded-lg border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="waiting_for_learner">Waiting on Learner</option>
                <option value="in_progress">Keep In Progress</option>
                <option value="resolved">Mark as Resolved</option>
              </select>
            </div>
          </div>

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your official response to the learner here. Be clear, courteous, and provide any relevant links or guidance..."
            rows={4}
            className="text-xs sm:text-sm resize-none rounded-xl"
            required
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-primary shrink-0" />
              <span>
                Learner will receive an automated email notification at{" "}
                <strong className="text-foreground">{ticket.learnerEmail}</strong>.
              </span>
            </p>

            <Button
              type="submit"
              disabled={replyMutation.isPending || !replyText.trim()}
              className="gap-2 text-xs font-semibold px-4 h-9 shrink-0"
            >
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Sending & Notifying...
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Send Reply & Notify Learner
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
