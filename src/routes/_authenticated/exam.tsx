import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Clock, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getExamOverview,
  resumeExamAttempt,
  saveExamAnswers,
  startExamAttempt,
  submitExamAttempt,
} from "@/lib/exam.functions";
import type { ExamPaper, ExamResult } from "@/lib/exam.types";

export const Route = createFileRoute("/_authenticated/exam")({
  head: () => ({
    meta: [
      { title: "Examination | ABB Certification Programme" },
      { name: "description", content: "Take the ABB certification examination." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function formatClock(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function Page() {
  const fetchOverview = useServerFn(getExamOverview);
  const startFn = useServerFn(startExamAttempt);
  const resumeFn = useServerFn(resumeExamAttempt);
  const queryClient = useQueryClient();

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["exam-overview"],
    queryFn: () => fetchOverview({}),
  });

  const start = useMutation({
    mutationFn: () => startFn({}),
    onSuccess: (p) => setPaper(p),
    onError: (error: Error) => toast.error(error.message),
  });

  const resume = useMutation({
    mutationFn: (attemptId: string) => resumeFn({ data: { attemptId } }),
    onSuccess: (p) => setPaper(p),
    onError: (error: Error) => toast.error(error.message),
  });

  const finish = (r: ExamResult) => {
    setPaper(null);
    setResult(r);
    queryClient.invalidateQueries({ queryKey: ["exam-overview"] });
  };

  if (isLoading) {
    return (
      <AppShell title="Examination">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!data?.enrolled) {
    return (
      <AppShell title="Examination">
        <h1 className="text-3xl font-semibold">Examination</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            The examination unlocks once you are enrolled and have completed the programme.
          </p>
          <Button asChild className="mt-5">
            <Link to="/checkout">Enroll now</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (paper) {
    return (
      <AppShell title="Examination">
        <ExamRunner paper={paper} onFinish={finish} />
      </AppShell>
    );
  }

  const { config, eligibility } = data;

  return (
    <AppShell title="Examination">
      <div className="max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Certification examination</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {config.questionCount} multiple-choice questions · {config.durationMinutes} minutes ·{" "}
            {config.passPercent}% to pass · {config.maxAttempts} attempts
          </p>
        </header>

        {result && (
          <section
            className={`rounded-2xl border p-6 ${
              result.isPassed
                ? "border-primary/40 bg-primary/5"
                : "border-destructive/40 bg-destructive/5"
            }`}
          >
            <h2 className="text-lg font-semibold">
              {result.isPassed ? "Congratulations — you passed" : "Not passed this time"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You scored {result.scorePercent}% ({result.score}/{result.totalMarks}). Pass mark is{" "}
              {result.passPercent}%.
            </p>
            {result.isPassed && (
              <Button asChild className="mt-4">
                <Link to="/certificate">View certificate status</Link>
              </Button>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Readiness
          </h2>
          <div className="mt-4 space-y-4">
            <Readiness
              label="Lessons completed"
              value={eligibility.lessonsCompleted}
              total={eligibility.lessonsTotal}
            />
            <Readiness
              label="Compulsory assignments approved"
              value={eligibility.assignmentsApproved}
              total={eligibility.assignmentsTotal}
            />
            <p className="text-xs text-muted-foreground">
              Attempts used: {eligibility.attemptsUsed} of {config.maxAttempts}
            </p>
          </div>

          {eligibility.reasons.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-border pt-5">
              {eligibility.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {data.activeAttempt ? (
              <Button
                onClick={() => resume.mutate(data.activeAttempt!.id)}
                disabled={resume.isPending}
              >
                {resume.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Clock className="size-4" />
                )}
                Resume attempt in progress
              </Button>
            ) : (
              <Button
                onClick={() => start.mutate()}
                disabled={!eligibility.canStart || start.isPending}
              >
                {start.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GraduationCap className="size-4" />
                )}
                Start examination
              </Button>
            )}
          </div>
        </section>

        {data.attempts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Attempt history
            </h2>
            <ul className="space-y-2">
              {data.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm"
                >
                  <span className="font-medium">Attempt {attempt.attemptNumber}</span>
                  <span className="text-muted-foreground">
                    {attempt.status === "in_progress"
                      ? "In progress"
                      : `${attempt.scorePercent ?? 0}% · ${attempt.isPassed ? "Passed" : "Not passed"}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(attempt.endedAt ?? attempt.startedAt).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Readiness({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value}/{total}
        </span>
      </div>
      <Progress value={percent} className="mt-2 h-2" />
    </div>
  );
}

function ExamRunner({ paper, onFinish }: { paper: ExamPaper; onFinish: (r: ExamResult) => void }) {
  const saveFn = useServerFn(saveExamAnswers);
  const submitFn = useServerFn(submitExamAttempt);
  const [answers, setAnswers] = useState<Record<string, string>>(paper.answers ?? {});
  const [index, setIndex] = useState(0);
  const [msLeft, setMsLeft] = useState(() => new Date(paper.expiresAt).getTime() - Date.now());
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const submit = useCallback(
    async (timedOut: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      try {
        const result = await submitFn({
          data: { attemptId: paper.attemptId, answers: answersRef.current, timedOut },
        });
        onFinish(result);
      } catch (error) {
        submittedRef.current = false;
        toast.error((error as Error).message);
      }
    },
    [onFinish, paper.attemptId, submitFn],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const left = new Date(paper.expiresAt).getTime() - Date.now();
      setMsLeft(left);
      if (left <= 0) void submit(true);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paper.expiresAt, submit]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void saveFn({ data: { attemptId: paper.attemptId, answers: answersRef.current } }).catch(
        () => undefined,
      );
    }, 20000);
    return () => window.clearInterval(timer);
  }, [paper.attemptId, saveFn]);

  const question = paper.questions[index];
  const answered = Object.keys(answers).length;
  const lowTime = msLeft < 5 * 60 * 1000;

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium">
            Question {index + 1} of {paper.questions.length}
          </p>
          <p className="text-xs text-muted-foreground">{answered} answered</p>
        </div>
        <span
          className={`rounded-lg border px-3 py-1.5 font-mono text-sm ${
            lowTime
              ? "border-destructive/50 text-destructive"
              : "border-border text-muted-foreground"
          }`}
        >
          {formatClock(msLeft)}
        </span>
      </header>

      <Progress value={((index + 1) / paper.questions.length) * 100} className="h-1.5" />

      {question && (
        <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-medium leading-relaxed">{question.prompt}</h2>
          <div className="mt-5 space-y-2">
            {question.options.map((option) => {
              const selected = answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-xs font-medium ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {option.id.toUpperCase()}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        </article>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Previous
        </Button>
        {index < paper.questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>Next question</Button>
        ) : (
          <Button onClick={() => void submit(false)}>
            <CheckCircle2 className="size-4" /> Submit examination
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {paper.questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`size-8 rounded-md border text-xs ${
              i === index
                ? "border-primary bg-primary text-primary-foreground"
                : answers[q.id]
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
