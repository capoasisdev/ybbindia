import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { TabBar } from "../components/ui/TabBar";
import {
  fetchRealAssignmentsFromSupabase,
  submitAssignmentWork,
  resolveSubmissionsForAssignment,
} from "../lib/api";
import { OFFICIAL_50_ASSIGNMENTS } from "../lib/lessonAssignmentsData";

export interface AppSubmission {
  id: string;
  attemptNumber: number;
  fileName?: string;
  fileSizeBytes?: number;
  learnerNote?: string;
  submittedAt: string;
  status: "submitted" | "under_review" | "approved" | "rejected" | "resubmit";
  reviewerFeedback?: string;
  score?: number | string;
}

export interface AppAssignmentItem {
  id: string;
  lessonId?: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  title: string;
  instructions: string;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxAttempts: number;
  isFinalProject?: boolean;
  submissions: AppSubmission[];
}

interface GroupedModuleAssignments {
  groupId: string;
  moduleNumber: number;
  moduleTitle: string;
  displayTitle: string;
  isFinalProject: boolean;
  assignments: AppAssignmentItem[];
}

export const AssignmentScreen: React.FC = () => {
  const { modules, user, showToast, navigateTo } = useApp();
  const isEnrolled = Boolean(user?.isEnrolled);

  // Generate fallback assignments from official 50 lesson assignments with local persistent submissions
  let globalLessonCounter = 0;
  const fallbackAssignments: AppAssignmentItem[] = modules.flatMap((m) => {
    return m.lessons.map((les) => {
      globalLessonCounter += 1;
      const official =
        OFFICIAL_50_ASSIGNMENTS.find(
          (oa) =>
            oa.lessonNum === globalLessonCounter ||
            (oa.moduleNum === m.number &&
              oa.title.toLowerCase().includes(les.title.toLowerCase().replace(/^\d+\.\s*/, "")))
        ) ||
        OFFICIAL_50_ASSIGNMENTS[globalLessonCounter - 1] || {
          lessonNum: globalLessonCounter,
          moduleNum: m.number,
          title: `Lesson ${globalLessonCounter}: ${les.title}`,
          instructions:
            les.summary ||
            `Complete the practical deliverable for "${les.title}" and submit your work for faculty evaluation.`,
          allowedFileTypes: ["pdf", "docx"],
          maxFileSizeMb: 10,
          maxAttempts: 3,
        };

      const asgnId = `asgn-${m.id}-${les.id}`;
      const localSubs = resolveSubmissionsForAssignment({
        id: asgnId,
        lessonId: les.id,
        title: official.title,
        position: globalLessonCounter,
      });

      return {
        id: asgnId,
        lessonId: les.id,
        moduleId: m.id,
        moduleNumber: m.number,
        moduleTitle: `Module ${m.number < 10 ? `0${m.number}` : m.number}: ${m.title}`,
        title: official.title,
        instructions: official.instructions,
        allowedFileTypes: official.allowedFileTypes || ["pdf", "docx", "xlsx", "zip"],
        maxFileSizeMb: official.maxFileSizeMb || 10,
        maxAttempts: official.maxAttempts || 3,
        isFinalProject: m.number === 12,
        submissions: localSubs as AppSubmission[],
      };
    });
  });

  // Add Capstone Deal Portfolio
  const capstoneSubs = resolveSubmissionsForAssignment({
    id: "asgn-final-capstone",
    title: "Final project — end-to-end broking mandate",
    position: 51,
  });

  fallbackAssignments.push({
    id: "asgn-final-capstone",
    moduleId: "mod-final",
    moduleNumber: 12,
    moduleTitle: "Final Capstone Deal Portfolio",
    title: "Final project — end-to-end broking mandate",
    instructions:
      "Prepare a complete broking mandate for an SME of your choice: business profile, valuation, marketing plan, buyer shortlist, negotiation strategy and closing checklist. Upload one PDF (max 25 MB).",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 25,
    maxAttempts: 3,
    isFinalProject: true,
    submissions: capstoneSubs as AppSubmission[],
  });

  const [assignmentList, setAssignmentList] = useState<AppAssignmentItem[]>(fallbackAssignments);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [attachedFiles, setAttachedFiles] = useState<Record<string, File | null>>({});
  const [learnerNotes, setLearnerNotes] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "submitted" | "approved">("all");

  // Fetch real admin assignments from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadDbAssignments() {
      setIsLoading(true);
      const dbAssignments = await fetchRealAssignmentsFromSupabase(user?.id);
      if (isMounted) {
        if (dbAssignments && dbAssignments.length > 0) {
          setAssignmentList(dbAssignments);
          // Expand first 2 module folders by default
          const defaultExpanded: Record<string, boolean> = {};
          if (dbAssignments[0]) defaultExpanded[dbAssignments[0].moduleTitle] = true;
          if (dbAssignments[1]) defaultExpanded[dbAssignments[1].moduleTitle] = true;
          setExpandedGroups(defaultExpanded);
        } else {
          const defaultExpanded: Record<string, boolean> = {};
          if (fallbackAssignments[0]) defaultExpanded[fallbackAssignments[0].moduleTitle] = true;
          if (fallbackAssignments[1]) defaultExpanded[fallbackAssignments[1].moduleTitle] = true;
          setExpandedGroups(defaultExpanded);
        }
        setIsLoading(false);
      }
    }
    loadDbAssignments();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Find which lessons are completed in real time
  const completedLessonIds = new Set(
    modules.flatMap((m) => m.lessons.filter((l) => l.isComplete).map((l) => l.id))
  );

  const isAllLessonsCompleted =
    modules.length > 0 && modules.every((m) => m.lessons.length > 0 && m.lessons.every((l) => l.isComplete));

  const isAssignmentUnlocked = (asgn: AppAssignmentItem): boolean => {
    if (!isEnrolled) return false;

    // Capstone / Final project unlocks when all modules/lessons are complete
    if (asgn.isFinalProject) {
      return isAllLessonsCompleted;
    }

    // Direct lesson ID match
    if (asgn.lessonId && completedLessonIds.has(asgn.lessonId)) {
      return true;
    }

    // Match by module number and position/title in modules
    const mod = modules.find((m) => m.id === asgn.moduleId || m.number === asgn.moduleNumber);
    if (mod) {
      const targetLesson = mod.lessons.find(
        (l) =>
          (asgn.lessonId && l.id === asgn.lessonId) ||
          asgn.title.toLowerCase().includes(l.title.toLowerCase().replace(/^\d+\.\s*/, "")) ||
          l.title.toLowerCase().includes(asgn.title.toLowerCase().replace(/^lesson\s*\d+:\s*/i, "")) ||
          asgn.id.includes(l.id)
      );
      if (targetLesson) {
        return Boolean(targetLesson.isComplete);
      }
    }

    return false;
  };

  // Show only assignments corresponding to lessons the user has completed
  const visibleAssignments = assignmentList.filter((asgn) => isAssignmentUnlocked(asgn));

  // Group assignments by moduleTitle (Exact Website Architecture)
  const groupedModules: GroupedModuleAssignments[] = [];
  visibleAssignments.forEach((asgn) => {
    const rawKey = asgn.isFinalProject
      ? "Final Capstone Project"
      : asgn.moduleTitle || "General Assignments";

    const displayTitle = asgn.isFinalProject
      ? "Final Capstone Deal Portfolio"
      : rawKey.startsWith("Module")
      ? rawKey
      : `Module ${asgn.moduleNumber < 10 ? `0${asgn.moduleNumber}` : asgn.moduleNumber}: ${rawKey}`;

    let group = groupedModules.find((g) => g.moduleTitle === rawKey);
    if (!group) {
      group = {
        groupId: `group-${asgn.moduleNumber || 0}`,
        moduleNumber: asgn.moduleNumber || 0,
        moduleTitle: rawKey,
        displayTitle,
        isFinalProject: Boolean(asgn.isFinalProject),
        assignments: [],
      };
      groupedModules.push(group);
    }
    group.assignments.push(asgn);
  });

  // Sort groups by module number
  groupedModules.sort((a, b) => {
    if (a.isFinalProject) return 1;
    if (b.isFinalProject) return -1;
    return a.moduleNumber - b.moduleNumber;
  });

  // Global Metrics
  const totalAssignments = visibleAssignments.length;
  const submittedCount = visibleAssignments.filter((a) => a.submissions.length > 0).length;
  const approvedCount = visibleAssignments.filter((a) =>
    a.submissions.some((s) => s.status === "approved")
  ).length;
  const overallPercent =
    totalAssignments > 0 ? Math.round((approvedCount / totalAssignments) * 100) : 0;

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    groupedModules.forEach((g) => {
      allOpen[g.moduleTitle] = true;
    });
    setExpandedGroups(allOpen);
    showToast("Expanded all module folders", "info");
  };

  const handleCollapseAll = () => {
    setExpandedGroups({});
    showToast("Collapsed all module folders", "info");
  };

  const isAllExpanded = groupedModules.every((g) => expandedGroups[g.moduleTitle]);

  const handleFileSelect = (asgnId: string, file: File | null, maxMb: number) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      showToast(`File size exceeds ${maxMb} MB limit`, "error");
      return;
    }
    setAttachedFiles((prev) => ({ ...prev, [asgnId]: file }));
    showToast(`File attached: ${file.name}`, "info");
  };

  const handleSubmitAssignment = (asgn: AppAssignmentItem) => {
    if (!isEnrolled) {
      showToast("Please enrol in the ABB programme to submit assignments", "info");
      navigateTo("enrol");
      return;
    }

    const file = attachedFiles[asgn.id];
    const noteText = learnerNotes[asgn.id] || "";

    if (!file && !noteText.trim()) {
      showToast("Please attach a file or write a note before submitting", "error");
      return;
    }

    const currentAttempts = asgn.submissions.length;
    if (currentAttempts >= asgn.maxAttempts) {
      showToast("Maximum submission attempts reached for this assignment", "error");
      return;
    }

    submitAssignmentWork(
      user?.id || "guest",
      asgn.id,
      file,
      noteText,
      asgn.lessonId,
      [asgn.title, asgn.moduleTitle, `pos_${asgn.moduleNumber}`]
    );

    const newSub: AppSubmission = {
      id: `sub-${asgn.id}-${Date.now()}`,
      attemptNumber: currentAttempts + 1,
      fileName: file?.name || "Executive_Summary.pdf",
      fileSizeBytes: file?.size || 1200000,
      learnerNote: noteText.trim() || "Assignment documentation attached.",
      submittedAt: "Just now",
      status: "submitted",
      reviewerFeedback:
        "Submission received! YBB's deal grading committee is evaluating your work. Feedback will be posted within 24 hours.",
    };

    setAssignmentList((prev) =>
      prev.map((item) => {
        if (item.id === asgn.id || (asgn.lessonId && item.lessonId === asgn.lessonId)) {
          return {
            ...item,
            submissions: [newSub, ...item.submissions],
          };
        }
        return item;
      })
    );

    setAttachedFiles((prev) => ({ ...prev, [asgn.id]: null }));
    setLearnerNotes((prev) => ({ ...prev, [asgn.id]: "" }));
    showToast(`Attempt #${currentAttempts + 1} submitted for faculty review!`, "success");
  };

  const handleDownload = (filename?: string) => {
    showToast(`Downloading ${filename || "document"}...`, "info");
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none overflow-hidden justify-between">
      {/* Top Navigation Header */}
      <TopBar title="Assignments &amp; Reviews" />

      {/* Main Content Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-3 flex flex-col gap-4 w-full">
        {/* Luxury Hero Banner */}
        <div className="w-full bg-gradient-to-br from-[#132242] via-[#1C2E56] to-[#0E1730] rounded-[22px] p-4 sm:p-5 text-[#F3EEE1] shadow-lift relative overflow-hidden border border-[#1F3363] shrink-0">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B4863A]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#E7CE9C] tracking-wider uppercase bg-[#E7CE9C]/15 border border-[#E7CE9C]/30 px-2.5 py-0.5 rounded-full">
                  Admin &amp; Course Evaluation
                </span>
                <h2 className="font-serif font-bold text-[20px] sm:text-[22px] text-white mt-1 leading-tight">
                  Module Practical Assignments
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#E7CE9C]/20 border border-[#E7CE9C]/30 flex flex-col items-center justify-center text-[#E7CE9C] shrink-0 font-serif font-bold text-[15px]">
                <span>{overallPercent}%</span>
                <span className="text-[8px] font-sans text-[#B9C0D6] uppercase tracking-tighter">Done</span>
              </div>
            </div>

            <p className="text-[12px] text-[#B9C0D6] leading-relaxed">
              Every curriculum module includes a practical assignment published by YBB's course administration team. Submit your deal models, teasers, and reports for faculty review.
            </p>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <div className="font-serif font-bold text-[15px] text-white">{submittedCount} / {totalAssignments}</div>
                <div className="text-[9.5px] text-[#B9C0D6] font-medium">Submitted</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <div className="font-serif font-bold text-[15px] text-[#E7CE9C]">{approvedCount}</div>
                <div className="text-[9.5px] text-[#B9C0D6] font-medium">Approved</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <div className="font-serif font-bold text-[15px] text-white">{totalAssignments - submittedCount}</div>
                <div className="text-[9.5px] text-[#B9C0D6] font-medium">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Non-Enrolled Callout */}
        {!isEnrolled && (
          <div className="w-full bg-[#FFFDF8] border border-[#E2D4BD] rounded-[18px] p-3.5 flex items-center justify-between gap-3 shadow-xs shrink-0">
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-bold text-[#132242]">Enrolment Required</div>
              <div className="text-[11px] text-[#7A7160] mt-0.5">Enrol in the ABB programme to unlock module assignments &amp; submit for grading.</div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("enrol")}
              className="btn btn-primary text-[12px] py-1.5 px-3 shrink-0 shadow-xs cursor-pointer"
            >
              Enrol Now
            </button>
          </div>
        )}

        {/* Status Filter & Expand Controls Bar */}
        <div className="flex flex-col gap-2.5 shrink-0 w-full">
          {/* Top Row: Title on Left, Expand/Collapse Toggle Button on Right */}
          <div className="flex items-center justify-between px-0.5 w-full">
            <div className="text-[11px] font-bold text-[#7A7160] tracking-wider uppercase">
              Module Folders ({groupedModules.length})
            </div>
            <button
              type="button"
              onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
              className="text-[11px] font-bold text-[#8C6425] hover:text-[#B4863A] bg-[#EEE6D3]/60 border border-[#E1D8C2] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isAllExpanded ? "▲ Collapse All" : "▼ Expand All"}</span>
            </button>
          </div>

          {/* Full-width 4-Column Segmented Filter Control */}
          <div className="grid grid-cols-4 gap-1 bg-[#EEE6D3] p-1 rounded-xl text-[11px] font-bold w-full border border-[#E1D8C2]">
            {(["all", "pending", "submitted", "approved"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`py-1.5 px-1 rounded-lg transition-all capitalize text-center cursor-pointer ${
                  statusFilter === key
                    ? "bg-[#132242] text-white shadow-xs"
                    : "text-[#7A7160] hover:text-[#132242]"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Module Accordion Folders List */}
        <div className="flex flex-col gap-3 w-full">
          {visibleAssignments.length === 0 ? (
            <div className="w-full bg-[#FFFDF8] border border-dashed border-[#E1D8C2] rounded-[22px] p-8 text-center shadow-xs flex flex-col items-center justify-center my-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EEE6D3] text-[#7A7160] flex items-center justify-center mb-3.5 shadow-inner">
                <svg fill="none" height="26" viewBox="0 0 24 24" width="26" className="text-[#8C6425]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-serif font-bold text-[17px] text-[#132242] mb-1.5">
                No Assignments Unlocked Yet
              </h3>
              <p className="text-[12.5px] text-[#7A7160] max-w-sm leading-relaxed mb-5">
                Assignments unlock one by one as you complete each lesson in the curriculum. Finish your lessons to unlock practical evaluation tasks and submit them for faculty review.
              </p>
              <button
                type="button"
                onClick={() => navigateTo("learn")}
                className="btn btn-primary text-[13px] py-2.5 px-5 shadow-xs cursor-pointer"
              >
                Go to Curriculum
              </button>
            </div>
          ) : (
            groupedModules.map((group) => {
            const isExpanded = Boolean(expandedGroups[group.moduleTitle]);
            const groupTotal = group.assignments.length;
            const groupApproved = group.assignments.filter((a) =>
              a.submissions.some((s) => s.status === "approved")
            ).length;
            const groupSubmitted = group.assignments.filter(
              (a) => a.submissions.length > 0
            ).length;

            // Filter check for group
            if (statusFilter === "approved" && groupApproved === 0) return null;
            if (statusFilter === "submitted" && groupSubmitted === 0) return null;
            if (statusFilter === "pending" && groupSubmitted === groupTotal) return null;

            const isFullyApproved = groupApproved === groupTotal && groupTotal > 0;
            const hasSubmissions = groupSubmitted > 0;

            return (
              <div
                key={group.moduleTitle}
                className={`w-full rounded-[18px] shadow-xs overflow-hidden transition-all shrink-0 bg-[#FFFDF8] border ${
                  isFullyApproved
                    ? "border-l-4 border-l-[#1E4B3E] border-[#E1D8C2]"
                    : hasSubmissions
                    ? "border-l-4 border-l-[#B4863A] border-[#E1D8C2]"
                    : "border-[#E1D8C2]"
                }`}
              >
                {/* Module Folder Header */}
                <div
                  onClick={() => toggleGroup(group.moduleTitle)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-serif font-bold text-[13px] shrink-0 shadow-2xs ${
                        isFullyApproved
                          ? "bg-[#1E4B3E] text-white"
                          : hasSubmissions
                          ? "bg-[#132242] text-[#E7CE9C]"
                          : "bg-[#EEE6D3] text-[#7A7160]"
                      }`}
                    >
                      {group.isFinalProject
                        ? "★"
                        : group.moduleNumber < 10
                        ? `0${group.moduleNumber}`
                        : group.moduleNumber}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] sm:text-[14px] font-bold text-[#132242] truncate">
                        {group.displayTitle}
                      </div>
                      <div className="text-[11px] text-[#7A7160] mt-0.5 flex items-center gap-2">
                        {isFullyApproved ? (
                          <span className="font-semibold text-[#1E4B3E]">✓ Approved</span>
                        ) : hasSubmissions ? (
                          <span className="font-semibold text-[#8C6425]">
                            {groupApproved}/{groupTotal} Approved · In Review
                          </span>
                        ) : (
                          <span>1 Practical Task · Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                        isFullyApproved
                          ? "bg-[#E4EEE8] text-[#1E4B3E]"
                          : hasSubmissions
                          ? "bg-[#E7CE9C]/30 text-[#8C6425]"
                          : "bg-[#EEE6D3] text-[#7A7160]"
                      }`}
                    >
                      {groupTotal} {groupTotal === 1 ? "Task" : "Tasks"}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#F6F1E6] flex items-center justify-center text-[#7A7160]">
                      <svg
                        fill="none"
                        height="14"
                        viewBox="0 0 24 24"
                        width="14"
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Folder Content */}
                {isExpanded && (
                  <div className="p-3.5 sm:p-4 pt-0 border-t border-[#E1D8C2] bg-[#F6F1E6]/40 flex flex-col gap-3.5">
                    {group.assignments.map((asgn) => {
                      const latestSub = asgn.submissions[0];
                      const isApproved = latestSub?.status === "approved";
                      const isUnderReview = latestSub?.status === "submitted" || latestSub?.status === "under_review";
                      const isRejected = latestSub?.status === "rejected" || latestSub?.status === "resubmit";
                      const attemptsUsed = asgn.submissions.length;
                      const attemptsLeft = Math.max(0, asgn.maxAttempts - attemptsUsed);
                      const canUploadNewAttempt = (!latestSub || isRejected) && !isApproved && attemptsLeft > 0;

                      return (
                        <div
                          key={asgn.id}
                          className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-4 shadow-xs flex flex-col gap-3.5 mt-3"
                        >
                          {/* Title & Status Badge */}
                          <div className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5 border-b border-[#E1D8C2]">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8C6425] bg-[#E7CE9C]/30 border border-[#B4863A]/20 px-2 py-0.5 rounded-full">
                                  {asgn.isFinalProject ? "Capstone Portfolio" : "Module Assignment"}
                                </span>
                              </div>
                              <h4 className="font-serif font-bold text-[15.5px] sm:text-[16.5px] text-[#132242] leading-tight">
                                {asgn.title}
                              </h4>
                            </div>

                            {/* Status Chip */}
                            <div className="shrink-0">
                              {!latestSub ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#EEE6D3] text-[#7A7160] border border-[#E1D8C2]">
                                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 3" />
                                  </svg>
                                  <span>Not Submitted</span>
                                </span>
                              ) : isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E4EEE8] text-[#1E4B3E] border border-[#1E4B3E]/30">
                                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span>Approved</span>
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#9A4230]/15 text-[#9A4230] border border-[#9A4230]/30">
                                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                                  </svg>
                                  <span>Revision Requested</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E7CE9C]/30 text-[#8C6425] border border-[#B4863A]/40">
                                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 3" />
                                  </svg>
                                  <span>Under Review</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Brief Instructions */}
                          <div>
                            <div className="text-[10.5px] font-bold text-[#7A7160] uppercase tracking-wider mb-1">
                              Brief &amp; Deliverables
                            </div>
                            <p className="text-[12.5px] text-[#132242] leading-relaxed bg-[#F6F1E6]/70 border border-[#E1D8C2] p-3 rounded-xl">
                              {asgn.instructions}
                            </p>
                          </div>

                          {/* Specifications Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[#7A7160] font-medium bg-[#F6F1E6] px-3 py-1.5 rounded-xl border border-[#E1D8C2]">
                            <span>
                              Accepted Formats: <strong className="text-[#132242]">{asgn.allowedFileTypes.join(", ").toUpperCase()}</strong>
                            </span>
                            <span>
                              Max File Size: <strong className="text-[#8C6425]">{asgn.maxFileSizeMb} MB</strong>
                            </span>
                          </div>

                          {/* Submission Logs */}
                          {asgn.submissions.length > 0 && (
                            <div className="flex flex-col gap-2 pt-2 border-t border-[#E1D8C2]">
                              <div className="text-[10.5px] font-bold text-[#7A7160] uppercase tracking-wider">
                                Submissions &amp; Faculty Feedback ({asgn.submissions.length})
                              </div>
                              {asgn.submissions.map((sub, idx) => (
                                <div
                                  key={sub.id}
                                  className="bg-[#F6F1E6] border border-[#E1D8C2] rounded-xl p-3 flex flex-col gap-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[10px] font-bold bg-[#132242] text-[#F3EEE1] px-2 py-0.5 rounded-md shrink-0">
                                        Submission #{asgn.submissions.length - idx}
                                      </span>
                                      <span className="text-[12px] font-bold text-[#132242] truncate flex items-center gap-1">
                                        <svg fill="none" height="13" viewBox="0 0 24 24" width="13" className="text-[#8C6425] shrink-0">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                          <path d="M16 13H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                          <path d="M16 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>{sub.fileName || "Assignment_Doc.pdf"}</span>
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDownload(sub.fileName)}
                                      className="text-[11px] font-bold text-[#8C6425] hover:text-[#B4863A] flex items-center gap-1 cursor-pointer shrink-0"
                                    >
                                      <svg fill="none" height="12" viewBox="0 0 24 24" width="12" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      <span>Download</span>
                                    </button>
                                  </div>

                                  {sub.learnerNote && (
                                    <p className="text-[11px] text-[#5A6786] italic bg-white/80 p-2 rounded-lg border border-[#E1D8C2]">
                                      "{sub.learnerNote}"
                                    </p>
                                  )}

                                  {sub.reviewerFeedback && (
                                    <div className={`p-2.5 rounded-xl border text-[11.5px] font-medium leading-relaxed ${
                                      sub.status === "approved"
                                        ? "bg-[#E4EEE8] border-[#1E4B3E]/20 text-[#1E4B3E]"
                                        : sub.status === "rejected" || sub.status === "resubmit"
                                        ? "bg-[#9A4230]/10 border-[#9A4230]/30 text-[#9A4230]"
                                        : "bg-[#E7CE9C]/20 border-[#B4863A]/30 text-[#8C6425]"
                                    }`}>
                                      <div className="flex items-center justify-between font-bold mb-0.5">
                                        <span>Faculty Reviewer Feedback:</span>
                                        {sub.score && (
                                          <span className="bg-[#132242] text-white px-2 py-0.5 rounded text-[10px]">
                                            {sub.score}
                                          </span>
                                        )}
                                      </div>
                                      <p>{sub.reviewerFeedback}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Lock Callout for Pending / Under Review */}
                          {isUnderReview && (
                            <div className="p-3 bg-[#E7CE9C]/20 border border-[#B4863A]/40 rounded-xl text-[12px] text-[#8C6425] font-medium flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-[#B4863A]/20 text-[#8C6425] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                🔒
                              </div>
                              <div>
                                <strong className="block text-[#132242]">Submission Under Review</strong>
                                Your submission has been received and is currently being evaluated by YBB's deal grading team. You cannot modify or re-upload your file while it is under evaluation.
                              </div>
                            </div>
                          )}

                          {/* Approval Callout */}
                          {isApproved && (
                            <div className="p-3 bg-[#E4EEE8] rounded-xl border border-[#1E4B3E]/30 text-[12px] text-[#1E4B3E] font-medium flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#1E4B3E] text-white flex items-center justify-center shrink-0 font-bold">
                                ✓
                              </div>
                              <span>This assignment has been reviewed and approved by YBB's deal grading committee.</span>
                            </div>
                          )}

                          {/* Upload Form - ONLY unlocked if not submitted yet OR if rejected by admin */}
                          {canUploadNewAttempt && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmitAssignment(asgn);
                              }}
                              className="flex flex-col gap-3 pt-3 border-t border-[#E1D8C2]"
                            >
                              {/* Rejection Alert Callout if previously rejected */}
                              {isRejected && (
                                <div className="p-3 bg-[#9A4230]/10 border border-[#9A4230]/30 rounded-xl text-[12px] text-[#9A4230] font-medium flex items-start gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#9A4230]/20 text-[#9A4230] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                    ⚠️
                                  </div>
                                  <div>
                                    <strong className="block text-[#7A3022]">Revision Requested by Admin</strong>
                                    The reviewer requested changes to your submission. Please review the faculty feedback above and upload a new assignment file below.
                                  </div>
                                </div>
                              )}

                              <div className="text-[10.5px] font-bold text-[#7A7160] uppercase tracking-wider">
                                Upload Assignment File
                              </div>

                              {!attachedFiles[asgn.id] ? (
                                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E1D8C2] hover:border-[#B4863A] bg-[#F6F1E6]/50 hover:bg-[#F6F1E6] rounded-xl cursor-pointer transition-all text-center group">
                                  <input
                                    type="file"
                                    accept={asgn.allowedFileTypes.map((t) => `.${t}`).join(",")}
                                    onChange={(e) =>
                                      handleFileSelect(
                                        asgn.id,
                                        e.target.files?.[0] || null,
                                        asgn.maxFileSizeMb
                                      )
                                    }
                                    className="hidden"
                                  />
                                  <div className="w-9 h-9 rounded-full bg-[#EEE6D3] group-hover:bg-[#E7CE9C]/50 text-[#8C6425] flex items-center justify-center mb-1.5 transition-colors">
                                    <svg fill="none" height="18" viewBox="0 0 24 24" width="18" stroke="currentColor" strokeWidth="1.8">
                                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                  <div className="text-[12px] font-bold text-[#132242] group-hover:text-[#8C6425]">
                                    Click to choose file or drag &amp; drop
                                  </div>
                                  <div className="text-[10px] text-[#7A7160] mt-0.5">
                                    {asgn.allowedFileTypes.join(", ").toUpperCase()} (Max {asgn.maxFileSizeMb} MB)
                                  </div>
                                </label>
                              ) : (
                                <div className="flex items-center justify-between p-3 bg-[#F6F1E6] border border-[#B4863A]/50 rounded-xl">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-[#B4863A]/15 text-[#8C6425] flex items-center justify-center shrink-0">
                                      <svg fill="none" height="16" viewBox="0 0 24 24" width="16" stroke="currentColor" strokeWidth="1.8">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                        <path d="M14 2v6h6" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[12px] font-bold text-[#132242] truncate">
                                        {attachedFiles[asgn.id]?.name}
                                      </div>
                                      <div className="text-[10px] text-[#7A7160]">
                                        {((attachedFiles[asgn.id]?.size || 0) / (1024 * 1024)).toFixed(2)} MB · Attached
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAttachedFiles((prev) => ({ ...prev, [asgn.id]: null }))
                                    }
                                    className="text-[11px] font-bold text-[#9A4230] hover:text-[#7A3022] px-2 py-1 rounded-lg hover:bg-[#9A4230]/10 transition-colors shrink-0 cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}

                              {/* Written Response note */}
                              <div>
                                <label className="block text-[10.5px] font-bold text-[#7A7160] uppercase tracking-wider mb-1">
                                  Written Response / Executive Summary
                                </label>
                                <textarea
                                  rows={2.5}
                                  value={learnerNotes[asgn.id] || ""}
                                  onChange={(e) =>
                                    setLearnerNotes((prev) => ({ ...prev, [asgn.id]: e.target.value }))
                                  }
                                  placeholder="Type your executive summary, key analysis, or notes for the faculty reviewer..."
                                  className="w-full bg-[#F6F1E6] border border-[#E1D8C2] rounded-lg p-2.5 text-[12px] outline-none focus:border-[#B4863A] transition-colors"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#132242] via-[#1C2E56] to-[#132242] text-[#E7CE9C] font-bold text-[13.5px] py-3 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#B4863A]/40 mt-1"
                              >
                                <svg fill="none" height="17" viewBox="0 0 24 24" width="17" stroke="currentColor" strokeWidth="2" className="text-[#E7CE9C]">
                                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Submit Assignment for Faculty Review</span>
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      {/* Tab Bar Navigation */}
      <TabBar />
    </div>
  );
};
