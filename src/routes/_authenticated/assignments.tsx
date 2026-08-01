import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Download, FileCheck2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  getLearnerAssignments,
  getSubmissionUrl,
  recordSubmission,
  type LearnerAssignment,
} from "@/lib/assignments.functions";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments | ABB Certification Programme" },
      { name: "description", content: "Submit your assignments and read reviewer feedback." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const STATUS_LABEL: Record<string, string> = {
  submitted: "Under review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Revision requested",
  resubmit: "Revision requested",
};

function Page() {
  const fetchAssignments = useServerFn(getLearnerAssignments);
  const { data, isLoading } = useQuery({
    queryKey: ["learner-assignments"],
    queryFn: () => fetchAssignments({}),
  });

  if (isLoading) {
    return (
      <AppShell title="Assignments">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!data?.enrolled) {
    return (
      <AppShell title="Assignments">
        <h1 className="text-3xl font-semibold">Assignments</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Assignments unlock once you are enrolled in the programme.
          </p>
          <Button asChild className="mt-5">
            <Link to="/checkout">Enroll now</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const total = data.assignments.length;

  // Group assignments by moduleTitle.
  const groups: { title: string; assignments: LearnerAssignment[] }[] = [];

  data.assignments.forEach((assignment) => {
    const key = assignment.isFinalProject
      ? "Final Project"
      : assignment.moduleTitle || "General Assignments";

    let group = groups.find((g) => g.title === key);
    if (!group) {
      group = { title: key, assignments: [] };
      groups.push(group);
    }
    group.assignments.push(assignment);
  });

  // Sort groups: Modules in order, then Final Project
  groups.sort((a, b) => {
    if (a.title === "Final Project") return 1;
    if (b.title === "Final Project") return -1;
    const matchA = a.title.match(/\d+/);
    const matchB = b.title.match(/\d+/);
    if (matchA && matchB) {
      return parseInt(matchA[0], 10) - parseInt(matchB[0], 10);
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <AppShell title="Assignments">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Assignments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.submittedCount} of {total} submitted · {data.approvedCount} approved
          </p>
        </header>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No assignments have been published yet.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {groups.map((group, groupIdx) => {
              const key = `group-${groupIdx}`;
              const groupTotal = group.assignments.length;
              const groupApproved = group.assignments.filter(
                (a) => a.submissions[0]?.status === "approved",
              ).length;
              const groupSubmitted = group.assignments.filter(
                (a) => a.submissions.length > 0,
              ).length;

              return (
                <AccordionItem
                  key={key}
                  value={key}
                  className="border border-border bg-card rounded-2xl px-6 py-1 shadow-soft"
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-semibold text-foreground">{group.title}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
                        {groupApproved} / {groupTotal} approved · {groupSubmitted} submitted
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6">
                    <div className="space-y-5 pt-3">
                      {group.assignments.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AppShell>
  );
}

export function AssignmentCard({ assignment }: { assignment: LearnerAssignment }) {
  const queryClient = useQueryClient();
  const submitFn = useServerFn(recordSubmission);
  const urlFn = useServerFn(getSubmissionUrl);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const latest = assignment.submissions[0];
  const attemptsLeft = assignment.maxAttempts - assignment.attemptsUsed;
  const approved = latest?.status === "approved";

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file first");
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!assignment.allowedFileTypes.includes(extension)) {
        throw new Error(
          `Only ${assignment.allowedFileTypes.join(", ").toUpperCase()} files are accepted`,
        );
      }
      if (file.size > assignment.maxFileSizeMb * 1024 * 1024) {
        throw new Error(`File exceeds ${assignment.maxFileSizeMb} MB`);
      }
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Session expired — please sign in again");

      const path = `${userId}/${assignment.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await supabase.storage.from("submissions").upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) throw new Error(error.message);

      await submitFn({
        data: {
          assignmentId: assignment.id,
          storagePath: path,
          fileName: file.name,
          fileSizeBytes: file.size,
          learnerNote: note,
        },
      });
    },
    onSuccess: () => {
      toast.success("Assignment submitted for review");
      setFile(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["learner-assignments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openSubmission = async (submissionId: string) => {
    const { url } = await urlFn({ data: { submissionId } });
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("That file is no longer available");
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {assignment.moduleTitle && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {assignment.moduleTitle}
            </p>
          )}
          {assignment.isFinalProject && (
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Final project
            </p>
          )}
          <h2 className="mt-1 text-lg font-semibold">{assignment.title}</h2>
        </div>
        <StatusChip status={latest?.status} />
      </div>

      {assignment.instructions && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {assignment.instructions}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {assignment.allowedFileTypes.join(", ").toUpperCase()} · up to {assignment.maxFileSizeMb} MB
        · {attemptsLeft} of {assignment.maxAttempts} attempts remaining
      </p>

      {assignment.submissions.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {assignment.submissions.map((s) => (
            <li key={s.id} className="rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  Attempt {s.attemptNumber} · {s.fileName ?? "submission"}
                </span>
                <button
                  type="button"
                  onClick={() => openSubmission(s.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="size-3.5" /> Download
                </button>
              </div>
              {s.learnerNote && (
                <p className="mt-1 text-xs text-muted-foreground">{s.learnerNote}</p>
              )}
              {s.reviewerFeedback && (
                <p className="mt-2 rounded-md border-l-2 border-primary bg-background p-2 text-xs">
                  <span className="font-medium">Reviewer:</span> {s.reviewerFeedback}
                  {s.score !== null && (
                    <span className="ml-1 text-muted-foreground">({s.score})</span>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!approved && attemptsLeft > 0 && (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <label className="block text-sm font-medium">
            Upload your work
            <input
              type="file"
              accept={assignment.allowedFileTypes.map((t) => `.${t}`).join(",")}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full cursor-pointer rounded-lg border border-border bg-background p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground"
            />
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the reviewer"
            rows={2}
          />
          <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Submit assignment
          </Button>
        </div>
      )}

      {approved && (
        <p className="mt-5 flex items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" /> This assignment has been approved.
        </p>
      )}

      {!approved && attemptsLeft <= 0 && (
        <p className="mt-5 flex items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
          <FileCheck2 className="size-4" /> All attempts used — contact support if you need another.
        </p>
      )}
    </article>
  );
}

function StatusChip({ status }: { status?: string }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> Not submitted
      </span>
    );
  }
  const approved = status === "approved";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
        approved
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground"
      }`}
    >
      {approved ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
