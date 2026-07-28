import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { LessonPlayer } from "@/components/app/LessonPlayer";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getLessonPlayback, saveLessonProgress } from "@/lib/learn.functions";

export const Route = createFileRoute("/_authenticated/learn/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson | ABB Certification Programme" },
      { name: "description", content: "Watch this lesson and record your completion progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPlayback = useServerFn(getLessonPlayback);
  const persistProgress = useServerFn(saveLessonProgress);

  const { data, isLoading } = useQuery({
    queryKey: ["lesson-playback", lessonId],
    queryFn: () => fetchPlayback({ data: { lessonId } }),
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const watchedRef = useRef<Set<number>>(new Set());
  const lastSavedRef = useRef(0);
  const [watchPercent, setWatchPercent] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  const lesson = data?.lesson ?? null;

  useEffect(() => {
    watchedRef.current = new Set();
    lastSavedRef.current = 0;
    setWatchPercent(lesson?.watchPercent ?? 0);
    setIsComplete(lesson?.isComplete ?? false);
  }, [lesson?.id, lesson?.watchPercent, lesson?.isComplete]);

  const push = async (payload: {
    watchedSeconds: number;
    watchPercent: number;
    lastPositionSeconds: number;
    manualComplete?: boolean;
  }) => {
    try {
      const result = await persistProgress({ data: { lessonId, ...payload } });
      setWatchPercent(result.watchPercent);
      if (result.isComplete && !isComplete) {
        setIsComplete(true);
        toast.success("Lesson marked complete");
        queryClient.invalidateQueries({ queryKey: ["course-outline"] });
        queryClient.invalidateQueries({ queryKey: ["learner-overview"] });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save progress");
    }
  };

  const onTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration || Number.isNaN(el.duration)) return;
    watchedRef.current.add(Math.floor(el.currentTime));
    const watchedSeconds = watchedRef.current.size;
    const percent = Math.min(100, Math.round((watchedSeconds / el.duration) * 100));
    setWatchPercent((prev) => Math.max(prev, percent));

    if (percent - lastSavedRef.current >= 5 || (percent >= (lesson?.completionWatchPercent ?? 90) && !isComplete)) {
      lastSavedRef.current = percent;
      void push({
        watchedSeconds,
        watchPercent: percent,
        lastPositionSeconds: Math.floor(el.currentTime),
      });
    }
  };

  const onEnded = () => {
    const el = videoRef.current;
    void push({
      watchedSeconds: watchedRef.current.size,
      watchPercent: 100,
      lastPositionSeconds: Math.floor(el?.currentTime ?? 0),
    });
  };

  const markComplete = async () => {
    setSaving(true);
    await push({
      watchedSeconds: 0,
      watchPercent: watchPercent,
      lastPositionSeconds: 0,
      manualComplete: true,
    });
    setSaving(false);
  };

  if (isLoading) {
    return (
      <AppShell title="Lesson">
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (!lesson) {
    return (
      <AppShell title="Lesson">
        <h1 className="text-2xl font-semibold">Lesson unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This lesson does not exist or is not part of your active enrolment.
        </p>
        <Button asChild className="mt-6">
          <Link to="/learn">Back to lessons</Link>
        </Button>
      </AppShell>
    );
  }

  const threshold = lesson.completionWatchPercent;

  return (
    <AppShell title={lesson.title}>
      <Link
        to="/learn"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All lessons
      </Link>

      <p className="mt-6 border-l-2 border-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {lesson.moduleTitle}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">{lesson.title}</h1>

      {lesson.isLocked ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Lock className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Complete the previous lesson to unlock this one.
          </p>
        </div>
      ) : (
        <>
          {lesson.videoUrl ? (
            <div className="mt-6">
              <LessonPlayer
                src={lesson.videoUrl}
                videoRef={videoRef}
                startAt={lesson.lastPositionSeconds}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
              />
            </div>
          ) : (
            <div className="mt-6 grid aspect-video w-full place-items-center rounded-2xl border border-border bg-secondary px-6 text-center text-sm text-muted-foreground">
              The video for this lesson has not been uploaded yet. You can still read the notes and
              mark the lesson as complete.
            </div>
          )}


          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {isComplete ? "Lesson complete" : `Watch ${threshold}% to complete`}
              </span>
              <span className="text-muted-foreground">{watchPercent}%</span>
            </div>
            <Progress value={watchPercent} className="mt-3" />
            {isComplete ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="size-4" />
                Recorded against your programme progress.
              </p>
            ) : !lesson.videoUrl ? (
              <Button className="mt-4" onClick={markComplete} disabled={saving}>
                Mark as complete
              </Button>
            ) : null}
          </div>

          {lesson.description ? (
            <div className="mt-5 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Lesson notes
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {lesson.description}
              </p>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={!lesson.previousLessonId}
          onClick={() =>
            lesson.previousLessonId &&
            navigate({ to: "/learn/$lessonId", params: { lessonId: lesson.previousLessonId } })
          }
        >
          <ArrowLeft className="size-4" />
          Previous
        </Button>
        <Button
          disabled={!lesson.nextLessonId}
          onClick={() =>
            lesson.nextLessonId &&
            navigate({ to: "/learn/$lessonId", params: { lessonId: lesson.nextLessonId } })
          }
        >
          Next lesson
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </AppShell>
  );
}
