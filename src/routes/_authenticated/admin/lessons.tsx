import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminLesson,
  deleteAdminLesson,
  getAdminCourseContent,
  moveAdminLesson,
  updateAdminLesson,
  type AdminLesson,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/lessons")({
  head: () => ({
    meta: [
      { title: "Lesson management | ABB Admin" },
      { name: "description", content: "Create, order, publish and edit ABB course lessons." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const fetchContent = useServerFn(getAdminCourseContent);
  const create = useServerFn(createAdminLesson);
  const update = useServerFn(updateAdminLesson);
  const remove = useServerFn(deleteAdminLesson);
  const move = useServerFn(moveAdminLesson);

  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ moduleId: string; title: string; videoUrl: string; summary: string } | null>(
    null,
  );
  const [editing, setEditing] = useState<AdminLesson | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-course-content"],
    queryFn: () => fetchContent(),
    retry: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-course-content"] });

  const run = async (key: string, fn: () => Promise<unknown>, message: string) => {
    setBusy(key);
    try {
      await fn();
      await refresh();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Lesson management">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading course content…
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Lesson management">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h1 className="text-lg font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have content administrator permissions.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Lesson management">
      <p className="border-l-2 border-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Admin console
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Lesson management</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {data?.courseTitle ?? "Course"} — create lessons, set their order, attach video URLs and
        control publishing.
      </p>

      <div className="mt-8 space-y-5">
        {data?.modules.map((module) => (
          <section key={module.id} className="rounded-2xl border border-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Module {module.position}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{module.title}</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraft({ moduleId: module.id, title: "", videoUrl: "", summary: "" })
                }
              >
                <Plus className="size-4" />
                Add lesson
              </Button>
            </header>

            {draft?.moduleId === module.id ? (
              <div className="space-y-3 border-b border-border bg-secondary/40 px-6 py-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`t-${module.id}`}>Lesson title</Label>
                    <Input
                      id={`t-${module.id}`}
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Lesson 1 — Introduction"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`v-${module.id}`}>Video URL</Label>
                    <Input
                      id={`v-${module.id}`}
                      value={draft.videoUrl}
                      onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                      placeholder="https://…/lesson.mp4"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`s-${module.id}`}>Summary (optional)</Label>
                  <Textarea
                    id={`s-${module.id}`}
                    value={draft.summary}
                    onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy === "create"}
                    onClick={() =>
                      run(
                        "create",
                        async () => {
                          await create({
                            data: {
                              moduleId: module.id,
                              title: draft.title,
                              videoUrl: draft.videoUrl,
                              summary: draft.summary,
                            },
                          });
                          setDraft(null);
                        },
                        "Lesson created",
                      )
                    }
                  >
                    {busy === "create" ? <Loader2 className="size-4 animate-spin" /> : null}
                    Create lesson
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <ul className="divide-y divide-border">
              {module.lessons.length === 0 ? (
                <li className="px-6 py-5 text-sm text-muted-foreground">No lessons yet.</li>
              ) : (
                module.lessons.map((lesson) => (
                  <li key={lesson.id} className="px-6 py-4">
                    {editing?.id === lesson.id ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor={`et-${lesson.id}`}>Title</Label>
                            <Input
                              id={`et-${lesson.id}`}
                              value={editing.title}
                              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`ev-${lesson.id}`}>Video URL</Label>
                            <Input
                              id={`ev-${lesson.id}`}
                              value={editing.videoUrl ?? ""}
                              onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`es-${lesson.id}`}>Summary</Label>
                          <Textarea
                            id={`es-${lesson.id}`}
                            rows={2}
                            value={editing.summary ?? ""}
                            onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={busy === lesson.id}
                            onClick={() =>
                              run(
                                lesson.id,
                                async () => {
                                  await update({
                                    data: {
                                      lessonId: lesson.id,
                                      title: editing.title,
                                      videoUrl: editing.videoUrl,
                                      summary: editing.summary,
                                    },
                                  });
                                  setEditing(null);
                                },
                                "Lesson updated",
                              )
                            }
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="w-8 text-sm text-muted-foreground">{lesson.position}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{lesson.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {lesson.videoUrl ?? "No video URL"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={lesson.isPublished}
                            disabled={busy === lesson.id}
                            onCheckedChange={(checked) =>
                              run(
                                lesson.id,
                                () =>
                                  update({
                                    data: { lessonId: lesson.id, isPublished: checked },
                                  }),
                                checked ? "Lesson published" : "Lesson unpublished",
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {lesson.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Move up"
                          disabled={busy === lesson.id}
                          onClick={() =>
                            run(
                              lesson.id,
                              () => move({ data: { lessonId: lesson.id, direction: "up" } }),
                              "Order updated",
                            )
                          }
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Move down"
                          disabled={busy === lesson.id}
                          onClick={() =>
                            run(
                              lesson.id,
                              () => move({ data: { lessonId: lesson.id, direction: "down" } }),
                              "Order updated",
                            )
                          }
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(lesson)}>
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete lesson"
                          disabled={busy === lesson.id}
                          onClick={() => {
                            if (!confirm(`Delete "${lesson.title}"?`)) return;
                            void run(
                              lesson.id,
                              () => remove({ data: { lessonId: lesson.id } }),
                              "Lesson deleted",
                            );
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
