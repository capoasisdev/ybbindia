import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminSubmissionUrl,
  listAdminSubmissions,
  listAuditLogs,
  reviewSubmission,
  type AdminSubmission,
  type ReviewDecision,
} from "@/lib/reviews.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Submission reviews | ABB Admin" },
      {
        name: "description",
        content: "Review learner assignment submissions, track review history and audit activity.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "resubmission_required", label: "Resubmission" },
  { value: "rejected", label: "Rejected" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-accent/15 text-accent-foreground border-accent/30",
  under_review: "bg-secondary text-foreground border-border",
  approved: "bg-primary/10 text-primary border-primary/30",
  resubmission_required: "bg-accent/10 text-foreground border-accent/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function Page() {
  const queryClient = useQueryClient();
  const fetchSubmissions = useServerFn(listAdminSubmissions);
  const fetchAudit = useServerFn(listAuditLogs);
  const fetchUrl = useServerFn(getAdminSubmissionUrl);
  const review = useServerFn(reviewSubmission);

  const [status, setStatus] = useState<string>("submitted");
  const [search, setSearch] = useState("");
  const [latestOnly, setLatestOnly] = useState(true);
  const [auditSearch, setAuditSearch] = useState("");
  const [showAudit, setShowAudit] = useState(false);

  const submissionsQuery = useQuery({
    queryKey: ["admin-submissions", status, search, latestOnly],
    queryFn: () => fetchSubmissions({ data: { status, search, latestOnly } }),
    retry: false,
  });

  const auditQuery = useQuery({
    queryKey: ["admin-audit", auditSearch],
    queryFn: () => fetchAudit({ data: { search: auditSearch } }),
    enabled: showAudit,
    retry: false,
  });

  const reviewMutation = useMutation({
    mutationFn: (vars: {
      submissionId: string;
      decision: ReviewDecision;
      feedback: string;
      score?: number | null;
    }) => review({ data: vars }),
    onSuccess: () => {
      toast.success("Review recorded");
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openFile = async (submissionId: string) => {
    const { url } = await fetchUrl({ data: { submissionId } });
    if (!url) return toast.error("File unavailable");
    window.open(url, "_blank", "noopener");
  };

  const counts = submissionsQuery.data?.counts ?? {};

  return (
    <AppShell title="Submission reviews">
      <h1 className="text-3xl font-semibold">Submission reviews</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Every learner submission with its full review history. Approve, reject or request a
        resubmission with written feedback — each decision is written to the audit trail.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatus(filter.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              status === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
            <span className="ml-2 text-xs opacity-70">{counts[filter.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search learner, email, assignment or file"
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={latestOnly}
            onChange={(e) => setLatestOnly(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Latest attempt only
        </label>
      </div>

      {submissionsQuery.isLoading && (
        <p className="mt-8 text-sm text-muted-foreground">Loading submissions…</p>
      )}
      {submissionsQuery.error && (
        <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(submissionsQuery.error as Error).message}
        </p>
      )}
      {submissionsQuery.data?.submissions.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No submissions match this filter.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {(submissionsQuery.data?.submissions ?? []).map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onOpenFile={() => openFile(submission.id)}
            onReview={(vars) => reviewMutation.mutate({ submissionId: submission.id, ...vars })}
            pending={reviewMutation.isPending}
          />
        ))}
      </div>

      <section className="mt-14 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Audit trail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent staff and system actions recorded across the platform.
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowAudit((v) => !v)}>
            {showAudit ? "Hide" : "Show"} audit log
          </Button>
        </div>

        {showAudit && (
          <div className="mt-6">
            <Input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search action, actor or entity"
              className="max-w-sm"
            />

            {auditQuery.isLoading && (
              <p className="mt-4 text-sm text-muted-foreground">Loading audit entries…</p>
            )}
            {auditQuery.error && (
              <p className="mt-4 text-sm text-destructive">{(auditQuery.error as Error).message}</p>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">When</th>
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 pr-4 font-medium">Entity</th>
                    <th className="pb-2 pr-4 font-medium">Actor</th>
                    <th className="pb-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(auditQuery.data ?? []).map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-2 pr-4 font-medium">{log.action}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {log.entityType}
                        {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{log.actorEmail ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{log.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditQuery.data?.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No audit entries found.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function SubmissionCard({
  submission,
  onOpenFile,
  onReview,
  pending,
}: {
  submission: AdminSubmission;
  onOpenFile: () => void;
  onReview: (vars: { decision: ReviewDecision; feedback: string; score?: number | null }) => void;
  pending: boolean;
}) {
  const [feedback, setFeedback] = useState(submission.reviewerFeedback ?? "");
  const [score, setScore] = useState(submission.score != null ? String(submission.score) : "");
  const [open, setOpen] = useState(false);

  const submit = (decision: ReviewDecision) => {
    onReview({
      decision,
      feedback,
      score: score.trim() === "" ? null : Number(score),
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium">{submission.assignmentTitle}</p>
            <span
              className={cn(
                "rounded-lg border px-2 py-0.5 text-xs font-medium capitalize",
                STATUS_STYLES[submission.status] ?? "border-border bg-secondary text-foreground",
              )}
            >
              {formatStatus(submission.status)}
            </span>
            {submission.isFinalProject && (
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Final project
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {submission.learnerName ?? "Unnamed learner"} · {submission.learnerEmail ?? "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Attempt {submission.attemptNumber} · submitted {formatDate(submission.submittedAt)}
          </p>
          {submission.learnerNote && (
            <p className="mt-3 rounded-lg border border-border bg-background p-3 text-sm">
              {submission.learnerNote}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpenFile}>
            Open file
          </Button>
          <Button variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Review"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback for the learner (required)"
            rows={4}
          />
          <Input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Score out of 100 (optional)"
            inputMode="numeric"
            className="max-w-[220px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending} onClick={() => submit("approved")}>
              Approve
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => submit("resubmission_required")}>
              Request resubmission
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => submit("under_review")}>
              Mark under review
            </Button>
            <Button variant="destructive" disabled={pending} onClick={() => submit("rejected")}>
              Reject
            </Button>
          </div>
        </div>
      )}

      {submission.history.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Review history
          </p>
          <ul className="mt-3 space-y-3">
            {submission.history.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium capitalize">{formatStatus(entry.decision)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {entry.reviewerName ?? "Staff"} · {formatDate(entry.createdAt)}
                </span>
                <p className="mt-1 text-muted-foreground">{entry.feedback}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
