import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Trash2,
  HelpCircle,
  FileCheck2,
  BookOpen,
  UploadCloud,
} from "lucide-react";
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
  getAdminAssignments,
  createAdminAssignment,
  updateAdminAssignment,
  deleteAdminAssignment,
  type AdminAssignment,
  getAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  type AdminQuestion,
} from "@/lib/admin.functions";

type SearchParams = {
  tab?: "lessons" | "assignments" | "questions";
};

export const Route = createFileRoute("/_authenticated/admin/lessons")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      tab: search.tab as any,
    };
  },
  head: () => ({
    meta: [
      { title: "Course Content Admin | ABB Admin" },
      {
        name: "description",
        content: "Manage course content: modules, lessons, assignments, and exam questions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const activeTab = tab || "lessons";
  const queryClient = useQueryClient();
  const fetchContent = useServerFn(getAdminCourseContent);
  const createLesson = useServerFn(createAdminLesson);
  const updateLesson = useServerFn(updateAdminLesson);
  const removeLesson = useServerFn(deleteAdminLesson);
  const moveLesson = useServerFn(moveAdminLesson);

  const fetchAssignments = useServerFn(getAdminAssignments);
  const addAssignment = useServerFn(createAdminAssignment);
  const editAssignment = useServerFn(updateAdminAssignment);
  const removeAssignment = useServerFn(deleteAdminAssignment);

  const fetchQuestions = useServerFn(getAdminQuestions);
  const addQuestion = useServerFn(createAdminQuestion);
  const editQuestion = useServerFn(updateAdminQuestion);
  const removeQuestion = useServerFn(deleteAdminQuestion);

  const [busy, setBusy] = useState<string | null>(null);

  // Lesson state
  const [draftLesson, setDraftLesson] = useState<{
    moduleId: string;
    title: string;
    videoUrl: string;
    summary: string;
  } | null>(null);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);

  // Assignment state
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [draftAssignment, setDraftAssignment] = useState({
    title: "",
    description: "",
    isCompulsory: true,
    isPublished: true,
  });
  const [editingAssignment, setEditingAssignment] = useState<AdminAssignment | null>(null);

  // Question state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState({
    prompt: "",
    options: ["", "", "", ""],
    correctOption: "",
    marks: 1,
  });
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);

  // Queries
  const {
    data: content,
    isLoading: isContentLoading,
    error: contentError,
  } = useQuery({
    queryKey: ["admin-course-content"],
    queryFn: () => fetchContent(),
    retry: false,
  });

  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: () => fetchAssignments(),
    retry: false,
  });

  const { data: questions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: () => fetchQuestions(),
    retry: false,
  });

  const refresh = (key: string) => queryClient.invalidateQueries({ queryKey: [key] });

  const run = async (
    key: string,
    queryKey: string,
    fn: () => Promise<unknown>,
    message: string,
  ) => {
    setBusy(key);
    try {
      await fn();
      await refresh(queryKey);
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  if (isContentLoading) {
    return (
      <AppShell title="Course content admin">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading course content…
        </div>
      </AppShell>
    );
  }

  if (contentError) {
    return (
      <AppShell title="Course content admin">
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
    <AppShell title="Course content admin">
      <p className="border-l-2 border-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Admin console
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Course content admin</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {content?.courseTitle ?? "Course"} — manage modules, lessons, compulsory assignments, and
        the exam question bank.
      </p>

      <div className="mt-8 space-y-6">
        {/* Lessons Management */}
        {activeTab === "lessons" && (
          <div className="space-y-5">
            {content?.modules.map((module) => (
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
                      setDraftLesson({ moduleId: module.id, title: "", videoUrl: "", summary: "" })
                    }
                  >
                    <Plus className="size-4" />
                    Add lesson
                  </Button>
                </header>

                {draftLesson?.moduleId === module.id ? (
                  <div className="space-y-3 border-b border-border bg-secondary/40 px-6 py-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`t-${module.id}`}>Lesson title</Label>
                        <Input
                          id={`t-${module.id}`}
                          value={draftLesson.title}
                          onChange={(e) =>
                            setDraftLesson({ ...draftLesson, title: e.target.value })
                          }
                          placeholder="Lesson 1 — Introduction"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`v-${module.id}`}>Video URL</Label>
                          <Link
                            to="/admin/upload-courses"
                            target="_blank"
                            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <UploadCloud className="size-3" />
                            R2 Upload Library
                          </Link>
                        </div>
                        <Input
                          id={`v-${module.id}`}
                          value={draftLesson.videoUrl}
                          onChange={(e) =>
                            setDraftLesson({ ...draftLesson, videoUrl: e.target.value })
                          }
                          placeholder="https://…/lesson.mp4"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`s-${module.id}`}>Summary (optional)</Label>
                      <Textarea
                        id={`s-${module.id}`}
                        value={draftLesson.summary}
                        onChange={(e) =>
                          setDraftLesson({ ...draftLesson, summary: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy === "create-lesson"}
                        onClick={() =>
                          run(
                            "create-lesson",
                            "admin-course-content",
                            async () => {
                              await createLesson({
                                data: {
                                  moduleId: module.id,
                                  title: draftLesson.title,
                                  videoUrl: draftLesson.videoUrl,
                                  summary: draftLesson.summary,
                                },
                              });
                              setDraftLesson(null);
                            },
                            "Lesson created",
                          )
                        }
                      >
                        {busy === "create-lesson" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Create lesson
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDraftLesson(null)}>
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
                        {editingLesson?.id === lesson.id ? (
                          <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <Label htmlFor={`et-${lesson.id}`}>Title</Label>
                                <Input
                                  id={`et-${lesson.id}`}
                                  value={editingLesson.title}
                                  onChange={(e) =>
                                    setEditingLesson({ ...editingLesson, title: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`ev-${lesson.id}`}>Video URL</Label>
                                  <Link
                                    to="/admin/upload-courses"
                                    target="_blank"
                                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                                  >
                                    <UploadCloud className="size-3" />
                                    R2 Upload Library
                                  </Link>
                                </div>
                                <Input
                                  id={`ev-${lesson.id}`}
                                  value={editingLesson.videoUrl ?? ""}
                                  onChange={(e) =>
                                    setEditingLesson({ ...editingLesson, videoUrl: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`es-${lesson.id}`}>Summary</Label>
                              <Textarea
                                id={`es-${lesson.id}`}
                                rows={2}
                                value={editingLesson.summary ?? ""}
                                onChange={(e) =>
                                  setEditingLesson({ ...editingLesson, summary: e.target.value })
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={busy === lesson.id}
                                onClick={() =>
                                  run(
                                    lesson.id,
                                    "admin-course-content",
                                    async () => {
                                      await updateLesson({
                                        data: {
                                          lessonId: lesson.id,
                                          title: editingLesson.title,
                                          videoUrl: editingLesson.videoUrl,
                                          summary: editingLesson.summary,
                                        },
                                      });
                                      setEditingLesson(null);
                                    },
                                    "Lesson updated",
                                  )
                                }
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLesson(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="w-8 text-sm text-muted-foreground">
                              {lesson.position}
                            </span>
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
                                    "admin-course-content",
                                    () =>
                                      updateLesson({
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
                                  "admin-course-content",
                                  () =>
                                    moveLesson({ data: { lessonId: lesson.id, direction: "up" } }),
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
                                  "admin-course-content",
                                  () =>
                                    moveLesson({
                                      data: { lessonId: lesson.id, direction: "down" },
                                    }),
                                  "Order updated",
                                )
                              }
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingLesson(lesson)}
                            >
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
                                  "admin-course-content",
                                  () => removeLesson({ data: { lessonId: lesson.id } }),
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
        )}

        {/* Assignments Management */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Course assignments</h2>
              <Button size="sm" onClick={() => setShowAddAssignment(!showAddAssignment)}>
                <Plus className="size-4" /> {showAddAssignment ? "Hide panel" : "Add assignment"}
              </Button>
            </div>

            {showAddAssignment && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="font-semibold text-sm">New assignment</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="as-title">Title</Label>
                    <Input
                      id="as-title"
                      value={draftAssignment.title}
                      onChange={(e) =>
                        setDraftAssignment({ ...draftAssignment, title: e.target.value })
                      }
                      placeholder="Assignment title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="as-desc">Description & Instructions</Label>
                    <Textarea
                      id="as-desc"
                      value={draftAssignment.description}
                      onChange={(e) =>
                        setDraftAssignment({ ...draftAssignment, description: e.target.value })
                      }
                      placeholder="Write detailed instructions for the assignment submission..."
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="as-comp"
                        checked={draftAssignment.isCompulsory}
                        onCheckedChange={(c) =>
                          setDraftAssignment({ ...draftAssignment, isCompulsory: c })
                        }
                      />
                      <Label htmlFor="as-comp">Compulsory (blocks exam until approved)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="as-pub"
                        checked={draftAssignment.isPublished}
                        onCheckedChange={(c) =>
                          setDraftAssignment({ ...draftAssignment, isPublished: c })
                        }
                      />
                      <Label htmlFor="as-pub">Publish immediately</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busy === "create-assignment"}
                      onClick={() =>
                        run(
                          "create-assignment",
                          "admin-assignments",
                          async () => {
                            await addAssignment({ data: draftAssignment });
                            setDraftAssignment({
                              title: "",
                              description: "",
                              isCompulsory: true,
                              isPublished: true,
                            });
                            setShowAddAssignment(false);
                          },
                          "Assignment created",
                        )
                      }
                    >
                      Create assignment
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddAssignment(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card">
              {isAssignmentsLoading ? (
                <div className="p-6 text-sm text-muted-foreground flex gap-2">
                  <Loader2 className="size-4 animate-spin" /> Loading assignments...
                </div>
              ) : !assignments || assignments.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No assignments configured yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {assignments.map((assignment) => (
                    <li key={assignment.id} className="p-6">
                      {editingAssignment?.id === assignment.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={editingAssignment.title}
                              onChange={(e) =>
                                setEditingAssignment({
                                  ...editingAssignment,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={editingAssignment.description ?? ""}
                              onChange={(e) =>
                                setEditingAssignment({
                                  ...editingAssignment,
                                  description: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-4">
                            <Button
                              size="sm"
                              disabled={busy === assignment.id}
                              onClick={() =>
                                run(
                                  assignment.id,
                                  "admin-assignments",
                                  async () => {
                                    await editAssignment({
                                      data: {
                                        assignmentId: assignment.id,
                                        title: editingAssignment.title,
                                        description: editingAssignment.description,
                                      },
                                    });
                                    setEditingAssignment(null);
                                  },
                                  "Assignment updated",
                                )
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingAssignment(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1 max-w-2xl">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base">{assignment.title}</h3>
                              {assignment.isCompulsory && (
                                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-destructive">
                                  Compulsory
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {assignment.description ?? "No description provided."}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={assignment.isPublished}
                                disabled={busy === assignment.id}
                                onCheckedChange={(checked) =>
                                  run(
                                    assignment.id,
                                    "admin-assignments",
                                    () =>
                                      editAssignment({
                                        data: { assignmentId: assignment.id, isPublished: checked },
                                      }),
                                    checked ? "Assignment published" : "Assignment drafted",
                                  )
                                }
                              />
                              <span className="text-xs text-muted-foreground">
                                {assignment.isPublished ? "Published" : "Draft"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Switch
                                checked={assignment.isCompulsory}
                                disabled={busy === assignment.id}
                                onCheckedChange={(checked) =>
                                  run(
                                    assignment.id,
                                    "admin-assignments",
                                    () =>
                                      editAssignment({
                                        data: {
                                          assignmentId: assignment.id,
                                          isCompulsory: checked,
                                        },
                                      }),
                                    checked ? "Marked as compulsory" : "Marked as optional",
                                  )
                                }
                              />
                              <span className="text-xs text-muted-foreground">Required</span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingAssignment(assignment)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={busy === assignment.id}
                              onClick={() => {
                                if (!confirm(`Delete assignment "${assignment.title}"?`)) return;
                                run(
                                  assignment.id,
                                  "admin-assignments",
                                  () => removeAssignment({ data: { assignmentId: assignment.id } }),
                                  "Assignment deleted",
                                );
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Question Bank */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Exam question bank</h2>
              <Button size="sm" onClick={() => setShowAddQuestion(!showAddQuestion)}>
                <Plus className="size-4" /> {showAddQuestion ? "Hide panel" : "Add question"}
              </Button>
            </div>

            {showAddQuestion && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="font-semibold text-sm">New question</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="q-prompt">Question Prompt</Label>
                    <Textarea
                      id="q-prompt"
                      value={draftQuestion.prompt}
                      onChange={(e) =>
                        setDraftQuestion({ ...draftQuestion, prompt: e.target.value })
                      }
                      placeholder="Enter the question prompt..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {draftQuestion.options.map((option, idx) => (
                      <div key={idx}>
                        <Label htmlFor={`q-opt-${idx}`}>Option {idx + 1}</Label>
                        <Input
                          id={`q-opt-${idx}`}
                          value={option}
                          onChange={(e) => {
                            const nextOptions = [...draftQuestion.options];
                            nextOptions[idx] = e.target.value;
                            setDraftQuestion({ ...draftQuestion, options: nextOptions });
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="q-correct">Correct Option</Label>
                      <select
                        id="q-correct"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={draftQuestion.correctOption}
                        onChange={(e) =>
                          setDraftQuestion({ ...draftQuestion, correctOption: e.target.value })
                        }
                      >
                        <option value="">Select the correct option</option>
                        {draftQuestion.options.map((opt, idx) => (
                          <option key={idx} value={opt} disabled={!opt.trim()}>
                            {opt.trim()
                              ? `Option ${idx + 1}: ${opt.trim()}`
                              : `Option ${idx + 1} (Empty)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="q-marks">Marks</Label>
                      <Input
                        id="q-marks"
                        type="number"
                        value={draftQuestion.marks}
                        onChange={(e) =>
                          setDraftQuestion({
                            ...draftQuestion,
                            marks: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busy === "create-question"}
                      onClick={() =>
                        run(
                          "create-question",
                          "admin-questions",
                          async () => {
                            await addQuestion({ data: draftQuestion });
                            setDraftQuestion({
                              prompt: "",
                              options: ["", "", "", ""],
                              correctOption: "",
                              marks: 1,
                            });
                            setShowAddQuestion(false);
                          },
                          "Question created",
                        )
                      }
                    >
                      Save question
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddQuestion(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card">
              {isQuestionsLoading ? (
                <div className="p-6 text-sm text-muted-foreground flex gap-2">
                  <Loader2 className="size-4 animate-spin" /> Loading question bank...
                </div>
              ) : !questions || questions.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No questions configured yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {questions.map((question, qIdx) => (
                    <li key={question.id} className="p-6">
                      {editingQuestion?.id === question.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Prompt</Label>
                            <Textarea
                              value={editingQuestion.prompt}
                              onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, prompt: e.target.value })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {editingQuestion.options.map((option, idx) => (
                              <div key={idx}>
                                <Label>Option {idx + 1}</Label>
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const nextOptions = [...editingQuestion.options];
                                    nextOptions[idx] = e.target.value;
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      options: nextOptions,
                                    });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label>Correct Option</Label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editingQuestion.correctOption}
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    correctOption: e.target.value,
                                  })
                                }
                              >
                                {editingQuestion.options.map((opt, idx) => (
                                  <option key={idx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Marks</Label>
                              <Input
                                type="number"
                                value={editingQuestion.marks}
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    marks: parseInt(e.target.value) || 1,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <Button
                              size="sm"
                              disabled={busy === question.id}
                              onClick={() =>
                                run(
                                  question.id,
                                  "admin-questions",
                                  async () => {
                                    await editQuestion({
                                      data: {
                                        questionId: question.id,
                                        prompt: editingQuestion.prompt,
                                        options: editingQuestion.options,
                                        correctOption: editingQuestion.correctOption,
                                        marks: editingQuestion.marks,
                                      },
                                    });
                                    setEditingQuestion(null);
                                  },
                                  "Question updated",
                                )
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingQuestion(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-muted-foreground">
                                Q{qIdx + 1}
                              </span>
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-2xs font-medium text-muted-foreground">
                                {question.marks} {question.marks === 1 ? "mark" : "marks"}
                              </span>
                            </div>
                            <p className="text-sm font-medium whitespace-pre-wrap">
                              {question.prompt}
                            </p>
                            <div className="grid gap-2 pl-4 sm:grid-cols-2 mt-2">
                              {question.options.map((opt, idx) => {
                                const isCorrect = opt === question.correctOption;
                                return (
                                  <div
                                    key={idx}
                                    className={`rounded-lg border px-3 py-2 text-xs flex items-center justify-between ${
                                      isCorrect
                                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                                        : "border-border bg-secondary/20 text-muted-foreground"
                                    }`}
                                  >
                                    <span>
                                      {idx + 1}. {opt}
                                    </span>
                                    {isCorrect && (
                                      <span className="font-semibold text-2xs uppercase">
                                        Correct
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingQuestion(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={busy === question.id}
                              onClick={() => {
                                if (!confirm("Are you sure you want to delete this question?"))
                                  return;
                                run(
                                  question.id,
                                  "admin-questions",
                                  () => removeQuestion({ data: { questionId: question.id } }),
                                  "Question deleted",
                                );
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
