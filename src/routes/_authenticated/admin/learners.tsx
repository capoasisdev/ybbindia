import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  Search,
  Download,
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Receipt,
  FileCheck2,
  Building,
  Briefcase,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listAdminLearners,
  getAdminLearnerDetails,
  type EnrolledLearnerSummary,
  type LearnerFullDetails,
} from "@/lib/learners.functions";
import { formatPaiseExact } from "@/domain/money";

export const Route = createFileRoute("/_authenticated/admin/learners")({
  head: () => ({
    meta: [
      { title: "Enrolled Learners | ABB Admin" },
      { name: "description", content: "Manage and monitor all enrolled learners and course progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLearnersPage,
});

function AdminLearnersPage() {
  const fetchLearners = useServerFn(listAdminLearners);
  const fetchLearnerDetails = useServerFn(getAdminLearnerDetails);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-enrolled-learners"],
    queryFn: () => fetchLearners(),
    staleTime: 60 * 1000,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "completed" | "passed" | "certified">("all");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: activeLearnerDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["admin-learner-detail", selectedUserId],
    queryFn: () => (selectedUserId ? fetchLearnerDetails({ data: { userId: selectedUserId } }) : null),
    enabled: Boolean(selectedUserId),
  });

  const learners = data?.learners ?? [];
  const stats = data?.stats ?? {
    totalEnrolled: 0,
    activeEnrolments: 0,
    courseCompletedCount: 0,
    examPassedCount: 0,
    certificatesIssuedCount: 0,
    totalRevenuePaise: 0,
  };

  // Filter learners
  const filteredLearners = useMemo(() => {
    return learners.filter((learner) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        learner.fullName.toLowerCase().includes(q) ||
        learner.email.toLowerCase().includes(q) ||
        (learner.mobile && learner.mobile.includes(q)) ||
        (learner.abbId && learner.abbId.toLowerCase().includes(q)) ||
        (learner.city && learner.city.toLowerCase().includes(q)) ||
        (learner.state && learner.state.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "active" && !learner.isActive) return false;
      if (statusFilter === "expired" && learner.isActive) return false;

      if (progressFilter === "completed" && learner.progressPercent < 100) return false;
      if (progressFilter === "passed" && !learner.hasPassedExam) return false;
      if (progressFilter === "certified" && learner.certificateStatus !== "active") return false;

      return true;
    });
  }, [learners, searchQuery, statusFilter, progressFilter]);

  // CSV Export handler
  const handleExportCsv = () => {
    if (!learners.length) return;

    const headers = [
      "Full Name",
      "Email",
      "Mobile",
      "ABB ID",
      "City",
      "State",
      "Profession",
      "Organisation",
      "Enrolment Date",
      "Valid Until",
      "Enrolment Status",
      "Source",
      "Order Amount (INR)",
      "Invoice Number",
      "Lessons Completed",
      "Total Lessons",
      "Course Progress %",
      "Assignments Submitted",
      "Assignments Approved",
      "Exam Passed",
      "Best Exam Score %",
      "Certificate Status",
    ];

    const csvRows = [headers.join(",")];

    for (const l of filteredLearners) {
      const feeInr = l.orderTotalPaise ? (l.orderTotalPaise / 100).toFixed(2) : "0.00";
      const values = [
        `"${(l.fullName || "").replace(/"/g, '""')}"`,
        `"${(l.email || "").replace(/"/g, '""')}"`,
        `"${(l.mobile || "").replace(/"/g, '""')}"`,
        `"${(l.abbId || "").replace(/"/g, '""')}"`,
        `"${(l.city || "").replace(/"/g, '""')}"`,
        `"${(l.state || "").replace(/"/g, '""')}"`,
        `"${(l.profession || "").replace(/"/g, '""')}"`,
        `"${(l.organisation || "").replace(/"/g, '""')}"`,
        `"${l.enrolledAt ? new Date(l.enrolledAt).toLocaleDateString() : ""}"`,
        `"${l.validUntil ? new Date(l.validUntil).toLocaleDateString() : ""}"`,
        `"${l.isActive ? "Active" : "Expired"}"`,
        `"${l.source || "purchase"}"`,
        `"${feeInr}"`,
        `"${(l.invoiceNumber || "").replace(/"/g, '""')}"`,
        l.lessonsCompletedCount,
        l.totalLessonsCount,
        `${l.progressPercent}%`,
        l.assignmentsSubmittedCount,
        l.assignmentsApprovedCount,
        l.hasPassedExam ? "Yes" : "No",
        l.bestScorePercent !== null ? `${l.bestScorePercent}%` : "N/A",
        `"${l.certificateStatus || "None"}"`,
      ];
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ybb_enrolled_learners_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell title="Enrolled Learners">
      <div className="space-y-8">
        {/* Header & Export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Enrolled Learners</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor candidate profiles, curriculum progression, assessment submissions, and certificate records.
            </p>
          </div>
          <Button
            onClick={handleExportCsv}
            disabled={!learners.length}
            variant="outline"
            className="flex items-center gap-2 self-start rounded-xl sm:self-auto"
          >
            <Download className="size-4" />
            Export CSV ({filteredLearners.length})
          </Button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Enrolled
              </span>
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold">{stats.totalEnrolled}</span>
              <span className="text-xs text-muted-foreground">({stats.activeEnrolments} active)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Completed Course
              </span>
              <div className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
                <BookOpen className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold">{stats.courseCompletedCount}</span>
              <span className="text-xs text-muted-foreground">
                {stats.totalEnrolled ? Math.round((stats.courseCompletedCount / stats.totalEnrolled) * 100) : 0}% of learners
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Exam Cleared
              </span>
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <GraduationCap className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold">{stats.examPassedCount}</span>
              <span className="text-xs text-muted-foreground">candidates passed</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Certificates Issued
              </span>
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Award className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold">{stats.certificatesIssuedCount}</span>
              <span className="text-xs text-muted-foreground">ABB accredited</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, city, or ABB ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Enrolment Statuses</option>
              <option value="active">Active Enrolment Only</option>
              <option value="expired">Expired Enrolment</option>
            </select>

            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Academic Stages</option>
              <option value="completed">Curriculum 100% Done</option>
              <option value="passed">Passed Examination</option>
              <option value="certified">Certificate Active</option>
            </select>
          </div>
        </div>

        {/* Learners Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card/60" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {(error as Error).message}
          </div>
        ) : filteredLearners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all" || progressFilter !== "all"
              ? "No learners match your current filter criteria."
              : "No enrolled learners found in the system yet."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Learner</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Enrolment</th>
                    <th className="px-5 py-4">Course Progress</th>
                    <th className="px-5 py-4">Assessments</th>
                    <th className="px-5 py-4">Certificate</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLearners.map((learner) => (
                    <tr
                      key={learner.id}
                      className="group cursor-pointer transition-colors hover:bg-muted/30"
                      onClick={() => setSelectedUserId(learner.userId)}
                    >
                      {/* Name & ABB ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                            {learner.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {learner.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {learner.abbId ? (
                                <span className="font-mono font-medium text-primary">{learner.abbId}</span>
                              ) : (
                                <span>Joined {new Date(learner.enrolledAt).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">{learner.email}</p>
                          {learner.mobile && <p className="font-mono text-muted-foreground/80">{learner.mobile}</p>}
                          {(learner.city || learner.state) && (
                            <p className="text-[11px] text-muted-foreground/60">
                              {[learner.city, learner.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Enrolment Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <Badge
                            variant={learner.isActive ? "default" : "secondary"}
                            className="text-[10px] uppercase font-semibold"
                          >
                            {learner.isActive ? "Active" : "Expired"}
                          </Badge>
                          <p className="text-[11px] text-muted-foreground">
                            {learner.validUntil
                              ? `Until ${new Date(learner.validUntil).toLocaleDateString()}`
                              : "Lifetime access"}
                          </p>
                        </div>
                      </td>

                      {/* Progress Bar */}
                      <td className="px-5 py-4">
                        <div className="w-36 space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{learner.progressPercent}%</span>
                            <span className="text-muted-foreground">
                              {learner.lessonsCompletedCount}/{learner.totalLessonsCount}
                            </span>
                          </div>
                          <Progress value={learner.progressPercent} className="h-1.5" />
                        </div>
                      </td>

                      {/* Assessments */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <FileCheck2 className="size-3 text-muted-foreground" />
                            <span>
                              {learner.assignmentsApprovedCount} approved
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="size-3 text-muted-foreground" />
                            {learner.hasPassedExam ? (
                              <span className="font-medium text-emerald-600">
                                Exam Passed ({learner.bestScorePercent}%)
                              </span>
                            ) : learner.examAttemptsCount > 0 ? (
                              <span className="text-amber-600">
                                Attempted ({learner.bestScorePercent ?? 0}%)
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not attempted</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Certificate */}
                      <td className="px-5 py-4">
                        {learner.certificateStatus === "active" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            Issued
                          </span>
                        ) : learner.hasPassedExam && learner.progressPercent >= 100 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            <Clock className="size-3" />
                            Eligible
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">In progress</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(learner.userId);
                          }}
                          className="h-8 gap-1.5 rounded-lg text-xs font-medium hover:bg-muted"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Sheet */}
      <Sheet open={Boolean(selectedUserId)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6">
          {isDetailsLoading || !activeLearnerDetails ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground animate-pulse">Loading learner details…</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header profile banner */}
              <SheetHeader className="text-left space-y-3 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 font-display text-xl font-bold text-primary">
                    {activeLearnerDetails.summary.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold">
                      {activeLearnerDetails.summary.fullName}
                    </SheetTitle>
                    {activeLearnerDetails.summary.abbId ? (
                      <p className="font-mono text-sm font-semibold text-primary">
                        ABB ID: {activeLearnerDetails.summary.abbId}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Enrolled: {new Date(activeLearnerDetails.summary.enrolledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <SheetDescription className="text-xs">
                  Review complete candidate profile, billing, curriculum progression and assessment records.
                </SheetDescription>
              </SheetHeader>

              {/* Tabs for Drawer */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="academic">Curriculum</TabsTrigger>
                  <TabsTrigger value="billing">Billing & KYC</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-5 pt-4 text-sm">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span>{activeLearnerDetails.summary.email}</span>
                      </div>
                      {activeLearnerDetails.summary.mobile && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <span className="font-mono">{activeLearnerDetails.summary.mobile}</span>
                        </div>
                      )}
                      {(activeLearnerDetails.summary.city || activeLearnerDetails.summary.state) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span>
                            {[activeLearnerDetails.summary.city, activeLearnerDetails.summary.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Professional Background
                    </h3>
                    <dl className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Profession</dt>
                        <dd className="font-medium mt-0.5">{activeLearnerDetails.summary.profession || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Organisation</dt>
                        <dd className="font-medium mt-0.5">{activeLearnerDetails.summary.organisation || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Education</dt>
                        <dd className="font-medium mt-0.5">{activeLearnerDetails.profile.education || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Name on Certificate</dt>
                        <dd className="font-medium mt-0.5">
                          {activeLearnerDetails.summary.certificateName || activeLearnerDetails.summary.fullName}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Certification Status
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">ABB Credential</span>
                      <Badge
                        variant={activeLearnerDetails.summary.certificateStatus === "active" ? "default" : "outline"}
                      >
                        {activeLearnerDetails.summary.certificateStatus === "active"
                          ? `Active (${activeLearnerDetails.summary.abbId})`
                          : "Not Yet Issued"}
                      </Badge>
                    </div>
                    {activeLearnerDetails.summary.certificateIssuedAt && (
                      <p className="text-[11px] text-muted-foreground">
                        Issued on {new Date(activeLearnerDetails.summary.certificateIssuedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Academic Progress Tab */}
                <TabsContent value="academic" className="space-y-5 pt-4 text-sm">
                  {/* Progress bar */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                        Lesson Progression
                      </span>
                      <span className="font-bold text-primary">
                        {activeLearnerDetails.summary.progressPercent}%
                      </span>
                    </div>
                    <Progress value={activeLearnerDetails.summary.progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {activeLearnerDetails.summary.lessonsCompletedCount} of{" "}
                      {activeLearnerDetails.summary.totalLessonsCount} published lessons completed.
                    </p>
                  </div>

                  {/* Exam Summary */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Examination Performance
                    </h3>
                    <dl className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Attempts</dt>
                        <dd className="font-bold text-base mt-0.5">
                          {activeLearnerDetails.summary.examAttemptsCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Best Score</dt>
                        <dd className="font-bold text-base mt-0.5">
                          {activeLearnerDetails.summary.bestScorePercent !== null
                            ? `${activeLearnerDetails.summary.bestScorePercent}%`
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Result</dt>
                        <dd className="mt-0.5">
                          {activeLearnerDetails.summary.hasPassedExam ? (
                            <Badge className="bg-emerald-600 text-white text-[10px]">PASSED</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">NOT PASSED</Badge>
                          )}
                        </dd>
                      </div>
                    </dl>

                    {activeLearnerDetails.examAttempts.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-border pt-2 text-xs">
                        <p className="font-medium text-muted-foreground">Attempt History:</p>
                        {activeLearnerDetails.examAttempts.map((att) => (
                          <div key={att.id} className="flex justify-between items-center py-1">
                            <span>Attempt #{att.attemptNumber}</span>
                            <span className="font-mono">{att.scorePercent ?? 0}% ({att.status})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignments */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Assignments Submissions ({activeLearnerDetails.submissions.length})
                    </h3>
                    {activeLearnerDetails.submissions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No assignment submissions yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeLearnerDetails.submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="rounded-lg border border-border/80 bg-background/50 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{sub.assignmentTitle}</span>
                              <Badge
                                variant={sub.status === "approved" ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {sub.status}
                              </Badge>
                            </div>
                            {sub.reviewerFeedback && (
                              <p className="text-[11px] text-muted-foreground italic">
                                Feedback: &ldquo;{sub.reviewerFeedback}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Billing & KYC Tab */}
                <TabsContent value="billing" className="space-y-5 pt-4 text-sm">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Payment & Invoice
                    </h3>
                    <dl className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Fee Paid</dt>
                        <dd className="font-bold text-sm mt-0.5">
                          {activeLearnerDetails.summary.orderTotalPaise
                            ? formatPaiseExact(activeLearnerDetails.summary.orderTotalPaise)
                            : "Complimentary / ₹0"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Order Status</dt>
                        <dd className="font-medium mt-0.5 uppercase">
                          {activeLearnerDetails.summary.orderStatus || "paid"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Invoice Number</dt>
                        <dd className="font-mono mt-0.5">
                          {activeLearnerDetails.summary.invoiceNumber || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Enrolment Source</dt>
                        <dd className="font-medium mt-0.5 capitalize">
                          {activeLearnerDetails.summary.source}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Billing Address & Tax Info
                    </h3>
                    <dl className="space-y-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">GSTIN</dt>
                        <dd className="font-mono mt-0.5">
                          {activeLearnerDetails.profile.gstNumber || "Unregistered"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd className="mt-0.5">
                          {activeLearnerDetails.profile.billingAddress ||
                            [
                              activeLearnerDetails.profile.billingCity,
                              activeLearnerDetails.profile.billingState,
                              activeLearnerDetails.profile.billingPincode,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                            "Not provided"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
