import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";
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
  const [showingInstructions, setShowingInstructions] = useState(false);
  const [instructSeconds, setInstructSeconds] = useState(60);

  const { data, isLoading } = useQuery({
    queryKey: ["exam-overview"],
    queryFn: () => fetchOverview({}),
  });

  const start = useMutation({
    mutationFn: () => startFn({}),
    onSuccess: (p) => {
      setPaper(p);
      setShowingInstructions(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setShowingInstructions(false);
    },
  });

  const resume = useMutation({
    mutationFn: (attemptId: string) => resumeFn({ data: { attemptId } }),
    onSuccess: (p) => setPaper(p),
    onError: (error: Error) => toast.error(error.message),
  });

  // Countdown timer for instruction slide
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showingInstructions && instructSeconds > 0) {
      interval = setInterval(() => {
        setInstructSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showingInstructions, instructSeconds]);

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

  // Instructions screen
  if (showingInstructions) {
    return (
      <AppShell title="Examination Instructions">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="flex items-center gap-3 border-b pb-4">
            <BookOpen className="size-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">General Instructions</h1>
              <p className="text-sm text-muted-foreground">Please read the following guidelines carefully before starting the exam.</p>
            </div>
          </header>

          <div className="bg-card border rounded-2xl p-6 space-y-4 text-sm text-foreground/90 leading-relaxed shadow-soft">
            <h2 className="font-semibold text-base">Test Rules & Mechanics</h2>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Total Duration:</strong> The exam duration is <strong>{data.config.durationMinutes} minutes</strong>. The timer starts the moment you click the button below.
              </li>
              <li>
                <strong>Questions:</strong> There are <strong>{data.config.questionCount} multiple-choice questions</strong> randomly drawn from the pool.
              </li>
              <li>
                <strong>Interface Navigation:</strong>
                <ul className="list-circle pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Use the <strong>Right Panel</strong> to monitor your question status grid.</li>
                  <li><span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></span> <strong>Green:</strong> Answered</li>
                  <li><span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1"></span> <strong>Red:</strong> Visited but unanswered</li>
                  <li><span className="inline-block w-3 h-3 bg-yellow-500 rounded-sm mr-1"></span> <strong>Yellow:</strong> Marked for review/later</li>
                  <li><span className="inline-block w-3 h-3 bg-muted rounded-sm mr-1"></span> <strong>Gray:</strong> Not visited yet</li>
                </ul>
              </li>
              <li>
                <strong>Continuous Timer:</strong> Once started, the exam cannot be paused or stopped. The system will automatically submit your answers when the timer runs out.
              </li>
              <li>
                <strong>Attempt Limit:</strong> You have a maximum of <strong>{data.config.maxAttempts} attempts</strong>.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/40 border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 text-primary" />
              <span>Time remaining to read: <strong className="font-mono text-foreground">{instructSeconds}s</strong></span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowingInstructions(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => start.mutate()}
                disabled={instructSeconds > 0 || start.isPending}
                className="min-w-[160px]"
              >
                {start.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <GraduationCap className="size-4 mr-2" />
                )}
                {instructSeconds > 0 ? `Read (${instructSeconds}s)` : "I am ready to start"}
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (paper) {
    return (
      <AppShell title="Examination Dashboard">
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
                onClick={() => {
                  setInstructSeconds(60);
                  setShowingInstructions(true);
                }}
                disabled={!eligibility.canStart}
              >
                <GraduationCap className="size-4 mr-2" />
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
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [markedForLater, setMarkedForLater] = useState<Set<string>>(new Set());
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Track visited questions
  useEffect(() => {
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, [index]);

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
  const lowTime = msLeft < 5 * 60 * 1000;

  // Statistics
  const totalCount = paper.questions.length;
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForLater.size;
  const visitedCount = visited.size;
  const skippedCount = Array.from(visited).filter(i => !answers[paper.questions[i].id] && !markedForLater.has(paper.questions[i].id)).length;
  const notVisitedCount = totalCount - visitedCount;

  // Helpers
  const clearResponse = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[question.id];
      return copy;
    });
  };

  const toggleMarkForReview = () => {
    setMarkedForLater((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (index < totalCount - 1) {
      setIndex(index + 1);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left panel: Active Question */}
      <div className="lg:col-span-2 space-y-6">
        <header className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Active Question</h2>
            <p className="text-sm font-medium mt-1">
              Question {index + 1} of {totalCount}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Time Remaining:</span>
            <span
              className={`rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold flex items-center gap-1.5 ${
                lowTime
                  ? "border-destructive/50 text-destructive bg-destructive/5 animate-pulse"
                  : "border-border text-foreground bg-muted/40"
              }`}
            >
              <Clock className="size-4" />
              {formatClock(msLeft)}
            </span>
          </div>
        </header>

        <Progress value={((index + 1) / totalCount) * 100} className="h-1.5" />

        {question && (
          <article className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
            <h3 className="text-lg font-medium leading-relaxed text-foreground">
              {question.prompt}
            </h3>
            
            <div className="space-y-2.5">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                    className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left text-sm transition-all duration-200 cursor-pointer ${
                      selected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {option.id.toUpperCase()}
                    </span>
                    <span className="font-medium">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </article>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 border border-border p-4 rounded-2xl">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={index === 0}
            >
              <ChevronLeft className="size-4 mr-1" /> Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResponse}
              disabled={!answers[question.id]}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-4 mr-1" /> Clear Response
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toggleMarkForReview();
                handleNext();
              }}
              className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 border border-yellow-500/20"
            >
              <Bookmark className="size-4 mr-1" />
              {markedForLater.has(question.id) ? "Unmark" : "Mark & Next"}
            </Button>

            {index < totalCount - 1 ? (
              <Button size="sm" onClick={handleNext}>
                Save & Next <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowConfirmSubmit(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="size-4 mr-1" /> Submit Exam
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Question Navigation Grid */}
      <div className="space-y-6">
        {/* Status statistics card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Examination Summary</h3>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 border border-border/60 bg-muted/20 p-2.5 rounded-lg">
              <span className="size-3 bg-green-500 rounded-full shrink-0"></span>
              <span>Answered: <strong className="font-semibold">{answeredCount}</strong></span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 bg-muted/20 p-2.5 rounded-lg">
              <span className="size-3 bg-red-500 rounded-full shrink-0"></span>
              <span>Skipped: <strong className="font-semibold">{skippedCount}</strong></span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 bg-muted/20 p-2.5 rounded-lg">
              <span className="size-3 bg-yellow-500 rounded-full shrink-0"></span>
              <span>Review: <strong className="font-semibold">{markedCount}</strong></span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 bg-muted/20 p-2.5 rounded-lg">
              <span className="size-3 bg-muted border rounded-full shrink-0"></span>
              <span>Not Visited: <strong className="font-semibold">{notVisitedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Question status grid */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Question Paper Panel</h3>
          
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {paper.questions.map((q, i) => {
              const isCurrent = i === index;
              const hasAnswer = !!answers[q.id];
              const isMarked = markedForLater.has(q.id);
              const isVisited = visited.has(i);

              let statusClass = "bg-muted text-muted-foreground border-border hover:bg-muted/80";
              if (isMarked) {
                statusClass = "bg-yellow-500 text-white border-yellow-600 shadow-sm";
              } else if (hasAnswer) {
                statusClass = "bg-green-500 text-white border-green-600 shadow-sm";
              } else if (isVisited) {
                statusClass = "bg-red-500 text-white border-red-600 shadow-sm";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`size-9 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer ${statusClass} ${
                    isCurrent ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowConfirmSubmit(true)}
            >
              <CheckCircle2 className="size-4 mr-1.5" /> Submit Examination
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-yellow-600">
              <HelpCircle className="size-6 shrink-0" />
              <h4 className="text-lg font-semibold">Submit Examination?</h4>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to finish and submit your exam? You have answered <strong>{answeredCount}</strong> out of <strong>{totalCount}</strong> questions.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowConfirmSubmit(false)}>
                Cancel and Resume
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  void submit(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Yes, Submit Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
