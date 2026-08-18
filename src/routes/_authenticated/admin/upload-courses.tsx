import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useMemo } from "react";
import {
  Folder,
  FolderPlus,
  UploadCloud,
  FileVideo,
  FileText,
  FileArchive,
  File,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Play,
  Trash2,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Loader2,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getR2Status,
  listR2Items,
  createR2FolderFn,
  getUploadPresignedUrlFn,
  deleteR2FileFn,
  deleteR2FolderFn,
  getCourseLessonsList,
  attachVideoToLessonFn,
  type LessonOption,
} from "@/lib/r2.functions";
import type { R2Item } from "@/lib/r2.server";

export const Route = createFileRoute("/_authenticated/admin/upload-courses")({
  head: () => ({
    meta: [
      { title: "Upload Courses & Video Library | ABB Admin" },
      {
        name: "description",
        content: "Upload course videos, organize folders, and manage Cloudflare R2 media storage.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UploadCoursesPage,
});

type UploadTask = {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "waiting" | "uploading" | "completed" | "error";
  errorMessage?: string;
  publicUrl?: string;
  xhr?: XMLHttpRequest;
};

function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getFileIcon(extension: string, isVideo: boolean) {
  if (isVideo) {
    return <FileVideo className="size-8 text-rose-500 shrink-0" />;
  }
  switch (extension) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileText className="size-8 text-blue-500 shrink-0" />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <FileArchive className="size-8 text-amber-500 shrink-0" />;
    default:
      return <File className="size-8 text-muted-foreground shrink-0" />;
  }
}

export function UploadCoursesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Path navigation state
  const [currentPrefix, setCurrentPrefix] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Dialog states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isUploadingAny, setIsUploadingAny] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<{
    url: string;
    publicUrl: string;
    title: string;
  } | null>(null);
  const [assignVideo, setAssignVideo] = useState<{ url: string; name: string } | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [isConfigGuideOpen, setIsConfigGuideOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "file" | "folder";
    keyOrPrefix: string;
    name: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Server functions
  const fetchStatus = useServerFn(getR2Status);
  const fetchListing = useServerFn(listR2Items);
  const createFolder = useServerFn(createR2FolderFn);
  const getPresignedUrl = useServerFn(getUploadPresignedUrlFn);
  const deleteFile = useServerFn(deleteR2FileFn);
  const deleteFolder = useServerFn(deleteR2FolderFn);
  const fetchLessons = useServerFn(getCourseLessonsList);
  const attachToLesson = useServerFn(attachVideoToLessonFn);

  // Queries
  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["r2-status"],
    queryFn: () => fetchStatus(),
  });

  const {
    data: listing,
    isLoading: isListingLoading,
    isFetching: isListingFetching,
  } = useQuery({
    queryKey: ["r2-listing", currentPrefix],
    queryFn: () => fetchListing({ data: { prefix: currentPrefix } }),
  });

  const { data: lessonOptions = [] } = useQuery({
    queryKey: ["course-lessons-list"],
    queryFn: () => fetchLessons(),
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["r2-listing"] });
    queryClient.invalidateQueries({ queryKey: ["r2-status"] });
  };

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const parts = currentPrefix.split("/").filter(Boolean);
    const crumbs = [{ label: "Root", prefix: "" }];
    let accumulated = "";
    for (const part of parts) {
      accumulated += `${part}/`;
      crumbs.push({ label: part, prefix: accumulated });
    }
    return crumbs;
  }, [currentPrefix]);

  const handleNavigateUp = () => {
    const parts = currentPrefix.split("/").filter(Boolean);
    if (parts.length <= 1) {
      setCurrentPrefix("");
    } else {
      parts.pop();
      setCurrentPrefix(`${parts.join("/")}/`);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createFolder({
        data: {
          parentPrefix: currentPrefix,
          folderName: newFolderName.trim(),
        },
      });
      toast.success(`Folder "${newFolderName.trim()}" created`);
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      refreshAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create folder");
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
    const validTasks: UploadTask[] = [];

    Array.from(files).forEach((f) => {
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(`"${f.name}" exceeds the 5 GB maximum upload size limit.`);
        return;
      }
      validTasks.push({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        size: f.size,
        progress: 0,
        status: "waiting",
      });
    });

    if (validTasks.length > 0) {
      setUploadTasks((prev) => [...prev, ...validTasks]);
      setIsUploadOpen(true);
    }
  };

  const executeUploadQueue = async () => {
    setIsUploadingAny(true);

    for (let i = 0; i < uploadTasks.length; i++) {
      const task = uploadTasks[i];
      if (task.status === "completed" || task.status === "uploading") continue;

      setUploadTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "uploading", progress: 0 } : t)),
      );

      try {
        const contentType =
          task.file.type || (task.name.endsWith(".mp4") ? "video/mp4" : "application/octet-stream");
        const presigned = await getPresignedUrl({
          data: {
            folderPrefix: currentPrefix,
            fileName: task.name,
            contentType,
          },
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presigned.uploadUrl, true);
          xhr.setRequestHeader("Content-Type", contentType);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t)),
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadTasks((prev) =>
                prev.map((t) =>
                  t.id === task.id
                    ? { ...t, progress: 100, status: "completed", publicUrl: presigned.publicUrl }
                    : t,
                ),
              );
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Upload aborted"));

          xhr.send(task.file);
        });
      } catch (err: any) {
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "error", errorMessage: err.message || "Upload failed" }
              : t,
          ),
        );
      }
    }

    setIsUploadingAny(false);
    toast.success("Upload queue processed");
    refreshAll();
  };

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success("Video URL copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "file") {
        await deleteFile({ data: { key: deleteTarget.keyOrPrefix } });
        toast.success(`Deleted ${deleteTarget.name}`);
      } else {
        await deleteFolder({ data: { folderPrefix: deleteTarget.keyOrPrefix } });
        toast.success(`Deleted folder ${deleteTarget.name}`);
      }
      setDeleteTarget(null);
      refreshAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleAssignLessonSubmit = async () => {
    if (!assignVideo || !selectedLessonId) {
      toast.error("Please select a lesson to assign");
      return;
    }
    try {
      await attachToLesson({
        data: {
          lessonId: selectedLessonId,
          videoUrl: assignVideo.url,
        },
      });
      toast.success("Video attached to lesson successfully!");
      setAssignVideo(null);
      setSelectedLessonId("");
      queryClient.invalidateQueries({ queryKey: ["admin-course-content"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to assign video");
    }
  };

  // Filter items based on search query
  const filteredFolders = useMemo(() => {
    if (!listing?.folders) return [];
    if (!searchQuery.trim()) return listing.folders;
    const q = searchQuery.toLowerCase();
    return listing.folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [listing?.folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!listing?.files) return [];
    if (!searchQuery.trim()) return listing.files;
    const q = searchQuery.toLowerCase();
    return listing.files.filter((f) => f.name.toLowerCase().includes(q));
  }, [listing?.files, searchQuery]);

  return (
    <AppShell title="Upload Courses">
      <div className="space-y-6 pb-12">
        {/* Header section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Upload Courses
              </h1>
              {status?.isConfigured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  R2 Connected ({status.bucketName})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfigGuideOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <AlertTriangle className="size-3.5" />
                  R2 Setup Needed
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload course video lessons, organize modules into folders, and manage media on
              Cloudflare R2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isListingFetching}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isListingFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateFolderOpen(true)}
              className="gap-1.5"
            >
              <FolderPlus className="size-3.5" />
              New Folder
            </Button>

            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 shadow-sm"
            >
              <UploadCloud className="size-4" />
              Upload Videos / Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,.pdf,.zip"
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Not configured banner if R2 env vars are missing */}
        {!isStatusLoading && !status?.isConfigured && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 shrink-0">
                  <Info className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Cloudflare R2 Storage Credentials Pending
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    To enable live video uploads to your Cloudflare R2 bucket, add{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                      R2_ACCOUNT_ID
                    </code>
                    ,{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                      R2_ACCESS_KEY_ID
                    </code>
                    ,{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                      R2_SECRET_ACCESS_KEY
                    </code>
                    , and{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                      R2_BUCKET_NAME
                    </code>{" "}
                    to your <code className="font-mono">.env</code> file.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigGuideOpen(true)}
                className="shrink-0 border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
              >
                View R2 Setup Guide
              </Button>
            </div>
          </div>
        )}

        {/* Explorer toolbar & breadcrumb trail */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Breadcrumb path */}
            <div className="flex items-center gap-1 overflow-x-auto text-sm py-1">
              {currentPrefix && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 mr-1"
                  onClick={handleNavigateUp}
                  title="Up one folder"
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
              )}
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={crumb.prefix} className="flex items-center gap-1 shrink-0">
                    {idx > 0 && <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
                    <button
                      type="button"
                      onClick={() => setCurrentPrefix(crumb.prefix)}
                      className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                        isLast
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Search and view mode */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search in folder…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center rounded-xl border border-border bg-background p-0.5 shrink-0">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <List className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Drop zone for instant upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelected(e.dataTransfer.files);
          }}
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-6 sm:p-8 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <UploadCloud className="size-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                Drag & Drop course videos or files here
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Supports MP4, WebM, MOV, MKV, and course materials. Uploads stream directly to
                Cloudflare R2 at maximum bandwidth.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Maximum Upload Size: 5 GB per file
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 text-xs rounded-xl"
            >
              Browse Computer
            </Button>
          </div>
        </div>

        {/* Main Content: Folder & File Explorer */}
        {isListingLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading R2 bucket contents…</p>
          </div>
        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Folder className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">This folder is empty</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a new subfolder or upload video lessons into this path.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateFolderOpen(true)}
                className="gap-1.5 text-xs"
              >
                <FolderPlus className="size-3.5" />
                Create Folder
              </Button>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <UploadCloud className="size-3.5" />
                Upload Files
              </Button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="space-y-6">
            {/* Folders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Folders ({filteredFolders.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.prefix}
                      className="group relative flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentPrefix(folder.prefix)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          <Folder className="size-5 fill-amber-500/20" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {folder.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Folder</p>
                        </div>
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteTarget({
                            type: "folder",
                            keyOrPrefix: folder.prefix,
                            name: folder.name,
                          })
                        }
                        className="size-8 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete folder"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Section */}
            {filteredFiles.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Videos & Files ({filteredFiles.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.key}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      {/* Video/File preview banner */}
                      <div className="relative aspect-video w-full bg-secondary/50 flex items-center justify-center p-3">
                        {getFileIcon(file.extension, file.isVideo)}

                        {file.isVideo && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewVideo({
                                url: file.previewUrl || file.publicUrl,
                                publicUrl: file.publicUrl,
                                title: file.name,
                              })
                            }
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <div className="grid size-10 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-110">
                              <Play className="size-4 ml-0.5 fill-black" />
                            </div>
                          </button>
                        )}

                        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                          {formatBytes(file.size)}
                        </span>
                      </div>

                      {/* Details & Actions */}
                      <div className="p-3.5 space-y-2">
                        <div className="min-w-0">
                          <p
                            className="truncate text-xs font-semibold text-foreground"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(file.lastModified)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 pt-2 border-t border-border">
                          {file.isVideo && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 flex-1 text-[11px] rounded-lg gap-1 px-2"
                                onClick={() =>
                                  setPreviewVideo({
                                    url: file.previewUrl || file.publicUrl,
                                    publicUrl: file.publicUrl,
                                    title: file.name,
                                  })
                                }
                              >
                                <Play className="size-3" />
                                Preview
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] rounded-lg gap-1 px-2 text-primary"
                                onClick={() =>
                                  setAssignVideo({
                                    url: file.publicUrl,
                                    name: file.name,
                                  })
                                }
                                title="Attach to Lesson"
                              >
                                <Link2 className="size-3" />
                                Link
                              </Button>
                            </>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyUrl(file.publicUrl, file.key)}
                            title="Copy Storage URL"
                          >
                            {copiedKey === file.key ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground hover:text-rose-600"
                            onClick={() =>
                              setDeleteTarget({
                                type: "file",
                                keyOrPrefix: file.key,
                                name: file.name,
                              })
                            }
                            title="Delete file"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Last Modified</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFolders.map((folder) => (
                    <tr
                      key={folder.prefix}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setCurrentPrefix(folder.prefix)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Folder className="size-4 text-amber-500 fill-amber-500/20 shrink-0" />
                          <span className="font-semibold text-foreground">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">Folder</td>
                      <td className="px-4 py-3 text-muted-foreground">-</td>
                      <td className="px-4 py-3 text-muted-foreground">-</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-rose-600"
                          onClick={() =>
                            setDeleteTarget({
                              type: "folder",
                              keyOrPrefix: folder.prefix,
                              name: folder.name,
                            })
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredFiles.map((file) => (
                    <tr key={file.key} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0 max-w-md">
                          {file.isVideo ? (
                            <FileVideo className="size-4 text-rose-500 shrink-0" />
                          ) : (
                            <File className="size-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-foreground truncate">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 uppercase text-muted-foreground font-mono">
                        {file.extension || "FILE"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatBytes(file.size)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(file.lastModified)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {file.isVideo && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() =>
                                  setPreviewVideo({
                                    url: file.previewUrl || file.publicUrl,
                                    publicUrl: file.publicUrl,
                                    title: file.name,
                                  })
                                }
                              >
                                <Play className="size-3" /> Preview
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-primary"
                                onClick={() =>
                                  setAssignVideo({
                                    url: file.publicUrl,
                                    name: file.name,
                                  })
                                }
                              >
                                <Link2 className="size-3" /> Assign
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleCopyUrl(file.publicUrl, file.key)}
                            title="Copy URL"
                          >
                            {copiedKey === file.key ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-rose-600"
                            onClick={() =>
                              setDeleteTarget({
                                type: "file",
                                keyOrPrefix: file.key,
                                name: file.name,
                              })
                            }
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="w-full max-w-md overflow-hidden sm:rounded-2xl p-6">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="size-5 text-primary" />
                Create New Folder
              </DialogTitle>
              <DialogDescription>
                Create a subfolder to organize your videos (e.g. "Module 1 - Fundamentals").
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 min-w-0 max-w-full">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="e.g. Module 01 - Anatomy & Physiology"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground min-w-0 max-w-full overflow-hidden">
                <span className="font-medium text-foreground">Target path:</span>{" "}
                <code className="font-mono break-all whitespace-normal">
                  {currentPrefix || "root/"}
                  {newFolderName || "new-folder"}/
                </code>
              </div>
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Queue Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="size-5 text-primary" />
              Upload Queue ({uploadTasks.length} {uploadTasks.length === 1 ? "file" : "files"})
            </DialogTitle>
            <DialogDescription className="truncate text-xs">
              Target: <code className="font-mono">{currentPrefix || "root/"}</code> • Direct
              Cloudflare R2 Upload (Max 5 GB per file)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 min-w-0 max-w-full">
            {uploadTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-border bg-card p-3 space-y-2 min-w-0 max-w-full"
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getFileIcon(task.name.split(".").pop() || "", task.name.endsWith(".mp4"))}
                    <span className="font-semibold text-foreground truncate">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">{formatBytes(task.size)}</span>
                    <span
                      className={`font-semibold capitalize ${
                        task.status === "completed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : task.status === "uploading"
                            ? "text-primary"
                            : task.status === "error"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground"
                      }`}
                    >
                      {task.status === "uploading" ? `${task.progress}%` : task.status}
                    </span>
                  </div>
                </div>

                <Progress value={task.progress} className="h-1.5" />

                {task.errorMessage && (
                  <p className="text-[11px] text-rose-500">{task.errorMessage}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadTasks([]);
                setIsUploadOpen(false);
              }}
              disabled={isUploadingAny}
            >
              Close
            </Button>

            <Button
              type="button"
              onClick={executeUploadQueue}
              disabled={
                isUploadingAny ||
                uploadTasks.length === 0 ||
                uploadTasks.every((t) => t.status === "completed")
              }
              className="gap-1.5"
            >
              {isUploadingAny ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading to R2…
                </>
              ) : (
                <>
                  <UploadCloud className="size-4" />
                  Start Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      <Dialog open={Boolean(previewVideo)} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="w-full max-w-3xl p-0 overflow-hidden bg-black/95 text-white sm:rounded-2xl border border-border/40">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {previewVideo && (
              <video
                key={previewVideo.url}
                src={previewVideo.url}
                controls
                autoPlay
                playsInline
                className="size-full max-h-[65vh] object-contain"
              />
            )}
          </div>

          <div className="p-4 bg-card text-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0 max-w-full">
            <div className="min-w-0 max-w-full flex-1">
              <h3 className="font-semibold text-sm truncate">{previewVideo?.title}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                {previewVideo?.publicUrl || previewVideo?.url}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (previewVideo)
                    handleCopyUrl(previewVideo.publicUrl || previewVideo.url, "preview");
                }}
                className="gap-1.5 text-xs"
              >
                <Copy className="size-3.5" />
                Copy URL
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (previewVideo) {
                    setAssignVideo({
                      url: previewVideo.publicUrl || previewVideo.url,
                      name: previewVideo.title,
                    });
                    setPreviewVideo(null);
                  }
                }}
                className="gap-1.5 text-xs"
              >
                <Link2 className="size-3.5" />
                Assign to Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Video to Lesson Modal */}
      <Dialog open={Boolean(assignVideo)} onOpenChange={() => setAssignVideo(null)}>
        <DialogContent className="w-full max-w-lg overflow-hidden sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="size-5 text-primary shrink-0" />
              Attach Video to Lesson
            </DialogTitle>
            <DialogDescription>
              Select an LMS lesson to immediately link this video URL to its curriculum player.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 min-w-0 max-w-full">
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 min-w-0 max-w-full overflow-hidden">
              <p className="text-xs font-semibold text-foreground">Selected Video:</p>
              <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                {assignVideo?.name}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground/80 break-all whitespace-normal select-all mt-1.5 bg-background/60 p-2 rounded-lg border border-border/50">
                {assignVideo?.url}
              </p>
            </div>

            <div className="space-y-2 min-w-0 max-w-full">
              <Label htmlFor="lesson-select">Choose Lesson</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger id="lesson-select" className="w-full max-w-full text-xs min-w-0">
                  <SelectValue placeholder="Select target lesson…" />
                </SelectTrigger>
                <SelectContent className="max-h-72 max-w-md">
                  {lessonOptions.map((lesson) => (
                    <SelectItem key={lesson.lessonId} value={lesson.lessonId} className="text-xs">
                      <span className="font-semibold text-primary/80 mr-1.5">
                        [{lesson.moduleTitle}]
                      </span>
                      {lesson.lessonPosition}. {lesson.lessonTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignVideo(null);
                setSelectedLessonId("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAssignLessonSubmit} disabled={!selectedLessonId}>
              Attach to Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="w-full max-w-md overflow-hidden sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="size-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="break-words">
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
              {deleteTarget?.type === "folder" && (
                <span className="block text-rose-500 mt-1 font-semibold">
                  Warning: All files inside this folder will be permanently deleted from Cloudflare
                  R2.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Yes, Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloudflare R2 Setup Guide Modal */}
      <Dialog open={isConfigGuideOpen} onOpenChange={setIsConfigGuideOpen}>
        <DialogContent className="w-full max-w-xl overflow-hidden sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Cloudflare R2 Setup Instructions
            </DialogTitle>
            <DialogDescription>
              Follow these simple steps to connect your Cloudflare R2 bucket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs text-muted-foreground leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">
                1. Create an R2 Bucket in Cloudflare
              </h4>
              <p>
                In Cloudflare Dashboard, navigate to <strong>R2 Object Storage</strong> &rarr;{" "}
                <strong>Create bucket</strong> (e.g. name it{" "}
                <code className="font-mono font-bold text-foreground">ybbindia-courses</code>).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">2. Generate R2 API Tokens</h4>
              <p>
                Under <strong>R2</strong> &rarr; <strong>Manage R2 API Tokens</strong> &rarr;{" "}
                <strong>Create API Token</strong>. Grant <strong>Object Read & Write</strong>{" "}
                permissions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">
                3. Add Environment Variables to <code className="font-mono">.env</code>
              </h4>
              <pre className="rounded-xl bg-muted p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                {`R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="ybbindia-courses"
R2_PUBLIC_DOMAIN="https://pub-xxxxxx.r2.dev" # (Optional: your public dev or custom domain)`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">
                4. Enable Public Access or Custom Domain (Recommended for streaming)
              </h4>
              <p>
                In your Cloudflare R2 bucket settings, under <strong>Settings</strong> &rarr;{" "}
                <strong>Public Access</strong>, enable <strong>R2.dev subdomain</strong> (e.g.{" "}
                <code className="font-mono">https://pub-xxx.r2.dev</code>) or connect your custom
                domain (e.g. <code className="font-mono">https://media.ybbindia.com</code>) and set
                it as <code className="font-mono">R2_PUBLIC_DOMAIN</code>.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" onClick={() => setIsConfigGuideOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
