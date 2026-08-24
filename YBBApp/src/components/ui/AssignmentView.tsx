import React, { useState, useEffect } from "react";
import { Module } from "../../types/app.types";
import {
  fetchRealAssignmentsFromSupabase,
  submitAssignmentWork,
  resolveSubmissionsForAssignment,
  getLocalSubmissionsMap,
} from "../../lib/api";
import { OFFICIAL_50_ASSIGNMENTS } from "../../lib/lessonAssignmentsData";
import { useApp } from "../../context/AppContext";

export interface SubmissionRecord {
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

export interface AppAssignment {
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
  submissions: SubmissionRecord[];
}

interface AssignmentViewProps {
  modules: Module[];
  selectedModuleId?: string;
  selectedLessonId?: string;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  onSelectModule?: (moduleId: string) => void;
  singleModuleOnly?: boolean;
}

export const AssignmentView: React.FC<AssignmentViewProps> = ({
  modules,
  selectedModuleId,
  selectedLessonId,
  showToast,
  onSelectModule,
  singleModuleOnly = false,
}) => {
  const { user } = useApp();
  // Build authentic lesson-level assignments matching the website layout
  let globalLessonCounter = 0;
  const fallbackAssignments: AppAssignment[] = modules.flatMap((m) => {
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
        submissions: localSubs as SubmissionRecord[],
      };
    });
  });

  // Add Final Capstone Project
  const capstoneSubs = resolveSubmissionsForAssignment({
    id: "asgn-final-capstone",
    title: "Final project — end-to-end broking mandate",
    position: 51,
  });

  fallbackAssignments.push({
    id: "asgn-final-capstone",
    moduleId: "mod-final",
    moduleNumber: 12,
    moduleTitle: "Final Capstone Project",
    title: "Final project — end-to-end broking mandate",
    instructions:
      "Prepare a complete broking mandate for an SME of your choice: business profile, valuation, marketing plan, buyer shortlist, negotiation strategy and closing checklist. Upload one PDF (max 25 MB).",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 25,
    maxAttempts: 3,
    isFinalProject: true,
    submissions: capstoneSubs as SubmissionRecord[],
  });

  const [assignmentList, setAssignmentList] = useState<AppAssignment[]>(fallbackAssignments);

  // Local state for user submissions per assignment ID or lesson ID
  const [submissionsState, setSubmissionsState] = useState<Record<string, SubmissionRecord[]>>(() => {
    return getLocalSubmissionsMap() as Record<string, SubmissionRecord[]>;
  });

  // State for active filter/module selection
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>(
    selectedModuleId || fallbackAssignments[0].moduleId
  );

  // Sync selectedModuleId when current lesson/module changes
  useEffect(() => {
    if (selectedModuleId) {
      setActiveModuleFilter(selectedModuleId);
    }
  }, [selectedModuleId]);

  // Fetch real admin assignments and submissions from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadDbAssignments() {
      const dbAssignments = await fetchRealAssignmentsFromSupabase(user?.id);
      if (isMounted && dbAssignments && dbAssignments.length > 0) {
        setAssignmentList(dbAssignments as any);

        // Populate submissionsState with all loaded submissions
        setSubmissionsState((prev) => {
          const next = { ...prev };
          for (const asgn of dbAssignments) {
            if (asgn.submissions && asgn.submissions.length > 0) {
              next[asgn.id] = asgn.submissions as any;
              if (asgn.lessonId) {
                next[asgn.lessonId] = asgn.submissions as any;
              }
            }
          }
          return next;
        });
      }
    }
    loadDbAssignments();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Upload form state per assignment
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const submittedCount = Object.keys(submissionsState).filter(
    (k) => (submissionsState[k]?.length || 0) > 0
  ).length;

  const approvedCount = Object.keys(submissionsState).filter((k) =>
    submissionsState[k]?.some((s) => s.status === "approved")
  ).length;

  const handleFileChange = (asgnId: string, file: File | null) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      showToast("File size exceeds 25 MB limit", "error");
      return;
    }
    setSelectedFiles((prev) => ({ ...prev, [asgnId]: file }));
    showToast(`File attached: ${file.name}`, "info");
  };

  const handleSubmitAssignment = async (asgn: AppAssignment) => {
    const file = selectedFiles[asgn.id];
    const noteText = notes[asgn.id] || "";

    if (!file && !noteText.trim()) {
      showToast("Please select a file or write a note before submitting", "error");
      return;
    }

    const currentSubmissions =
      submissionsState[asgn.id] && submissionsState[asgn.id].length > 0
        ? submissionsState[asgn.id]
        : asgn.lessonId && submissionsState[asgn.lessonId] && submissionsState[asgn.lessonId].length > 0
        ? submissionsState[asgn.lessonId]
        : asgn.submissions || [];

    const attemptNum = currentSubmissions.length + 1;

    if (attemptNum > asgn.maxAttempts) {
      showToast("Maximum submission attempts reached for this assignment", "error");
      return;
    }

    // Call Supabase submission API & local persistence
    const res = await submitAssignmentWork(
      user?.id || "guest",
      asgn.id,
      file,
      noteText,
      asgn.lessonId,
      [asgn.title, asgn.moduleTitle, `pos_${asgn.moduleNumber}`]
    );

    const newSub: SubmissionRecord = {
      id: res?.submission?.id || `sub-${asgn.id}-${Date.now()}`,
      attemptNumber: attemptNum,
      fileName: file?.name || "Assignment_Deliverable.pdf",
      fileSizeBytes: file?.size || 1200000,
      learnerNote: noteText.trim() || "Assignment work attached.",
      submittedAt: "Just now",
      status: "submitted",
      reviewerFeedback:
        "Submission received. YBB's grading faculty will evaluate your submission within 24 hours.",
    };

    const updatedList = [newSub, ...currentSubmissions];

    setSubmissionsState((prev) => {
      const next = { ...prev, [asgn.id]: updatedList };
      if (asgn.lessonId) next[asgn.lessonId] = updatedList;
      return next;
    });

    setAssignmentList((prev) =>
      prev.map((item) =>
        item.id === asgn.id || (asgn.lessonId && item.lessonId === asgn.lessonId)
          ? { ...item, submissions: updatedList }
          : item
      )
    );

    setSelectedFiles((prev) => ({ ...prev, [asgn.id]: null }));
    setNotes((prev) => ({ ...prev, [asgn.id]: "" }));
    showToast(`Assignment submitted for faculty review!`, "success");
  };

  const handleDownloadFile = (fileName?: string) => {
    showToast(`Downloading ${fileName || "submission file"}...`, "info");
  };

  // Check if active lesson is an intro/introduction lesson
  const currentModuleObj = modules.find((m) => m.id === selectedModuleId);
  const currentModuleNum = currentModuleObj?.number;
  const activeLessonObj = currentModuleObj?.lessons.find((l) => l.id === selectedLessonId);

  const isIntroLesson = Boolean(
    activeLessonObj &&
      (activeLessonObj.title.toLowerCase().includes("intro") ||
        activeLessonObj.title.toLowerCase().includes("introduction") ||
        activeLessonObj.id.toLowerCase().includes("intro"))
  );

  const moduleSpecificAssignments = assignmentList.filter((a) => {
    if (!selectedModuleId) return false;
    return (
      a.moduleId === selectedModuleId ||
      (currentModuleNum && a.moduleNumber === currentModuleNum) ||
      a.id.includes(selectedModuleId)
    );
  });

  // Find exact lesson-level assignment match
  const matchedLessonAssignment = assignmentList.find(
    (a) =>
      (selectedLessonId && a.lessonId === selectedLessonId) ||
      (selectedModuleId && selectedLessonId && a.id === `asgn-${selectedModuleId}-${selectedLessonId}`) ||
      (selectedLessonId && a.id.endsWith(selectedLessonId)) ||
      (activeLessonObj && a.title.toLowerCase().includes(activeLessonObj.title.toLowerCase().replace(/^\d+\.\s*/, "")))
  );

  const assignmentsToRender = singleModuleOnly
    ? matchedLessonAssignment
      ? [matchedLessonAssignment]
      : moduleSpecificAssignments.length > 0
      ? [moduleSpecificAssignments[0]]
      : [assignmentList[0]]
    : assignmentList.filter((a) => a.moduleId === activeModuleFilter).length > 0
    ? assignmentList.filter((a) => a.moduleId === activeModuleFilter)
    : [assignmentList[0]];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Website-Style Summary Header */}
      {!singleModuleOnly && (
        <div className="bg-[#132242] rounded-2xl p-4 sm:p-5 text-[#F3EEE1] border border-[#1F3363] shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <span className="text-[10.5px] font-bold text-[#E7CE9C] tracking-wider uppercase">
                ABB Certification Programme
              </span>
              <h3 className="font-serif font-bold text-[18px] sm:text-[20px] text-white leading-tight mt-0.5">
                Assignments &amp; Practical Reviews
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#E7CE9C]/20 border border-[#E7CE9C]/30 text-[#E7CE9C] px-3 py-1 rounded-full whitespace-nowrap">
                {submittedCount} of {assignmentList.length} Submitted
              </span>
              <span className="text-[11px] font-bold bg-[#1E4B3E] text-[#E4EEE8] px-3 py-1 rounded-full whitespace-nowrap">
                {approvedCount} Approved
              </span>
            </div>
          </div>
          <p className="text-[12px] text-[#B9C0D6] leading-relaxed">
            Each module includes a practical assignment reviewed by YBB's senior deal faculty. Submit your work and receive detailed grading feedback.
          </p>
        </div>
      )}

      {/* Module Selector Accordion Tabs */}
      {!singleModuleOnly && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full shrink-0">
          {assignmentList.map((a: AppAssignment) => {
            const isSelected = a.moduleId === activeModuleFilter;
            const subList = submissionsState[a.id] || [];
            const isApproved = subList.some((s) => s.status === "approved");
            const hasSubmitted = subList.length > 0;

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setActiveModuleFilter(a.moduleId);
                  if (onSelectModule && a.moduleId !== "mod-final") {
                    onSelectModule(a.moduleId);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isSelected
                    ? "bg-[#132242] text-[#FFFDF8] border-[#132242] shadow-xs"
                    : "bg-[#FFFDF8] text-[#7A7160] border-[#E1D8C2] hover:border-[#B4863A]"
                }`}
              >
                {isApproved ? (
                  <span className="text-[#1E4B3E] text-[12px]">✓</span>
                ) : hasSubmitted ? (
                  <span className="text-[#B4863A] text-[12px]">●</span>
                ) : null}
                <span>{a.isFinalProject ? "Final Project" : `Mod ${a.moduleNumber}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Assignment Detail Cards or Intro Notice */}
      {singleModuleOnly && isIntroLesson ? (
        <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2.5 shadow-xs">
          <div className="w-11 h-11 rounded-full bg-[#EEE6D3] text-[#8C6425] flex items-center justify-center text-[20px]">
            💡
          </div>
          <div>
            <h4 className="font-serif font-bold text-[16px] text-[#132242]">
              Introduction Lesson
            </h4>
            <p className="text-[12.5px] text-[#7A7160] max-w-sm mt-1 leading-relaxed">
              This introduction lesson provides foundational overview. No practical assignment submission is required for this lesson. Please proceed to the topic lessons.
            </p>
          </div>
        </div>
      ) : (
        assignmentsToRender.map((asgn) => {
          const subList =
            submissionsState[asgn.id] && submissionsState[asgn.id].length > 0
              ? submissionsState[asgn.id]
              : asgn.lessonId && submissionsState[asgn.lessonId] && submissionsState[asgn.lessonId].length > 0
              ? submissionsState[asgn.lessonId]
              : asgn.submissions || [];
          const latestSub = subList[0];
          const isApproved = latestSub?.status === "approved";
          const isUnderReview = latestSub?.status === "submitted" || latestSub?.status === "under_review";
          const isRejected = latestSub?.status === "rejected" || latestSub?.status === "resubmit";
          const attemptsUsed = subList.length;
          const attemptsLeft = Math.max(0, asgn.maxAttempts - attemptsUsed);
          const canUploadNewAttempt = (!latestSub || isRejected) && !isApproved && attemptsLeft > 0;

        return (
          <div key={asgn.id} className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
            {/* Header & Status Chip */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E1D8C2]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6425] bg-[#E7CE9C]/30 border border-[#B4863A]/20 px-2.5 py-0.5 rounded-full">
                    {asgn.isFinalProject ? "Final Project" : `Module ${asgn.moduleNumber}`}
                  </span>
                  {asgn.isFinalProject && (
                    <span className="text-[10px] font-bold text-[#1E4B3E] bg-[#E4EEE8] px-2 py-0.5 rounded-full">
                      Capstone Deal Portfolio
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-[17px] sm:text-[19px] text-[#132242] leading-tight">
                  {asgn.title}
                </h4>
                <div className="text-[11.5px] text-[#7A7160] mt-0.5">
                  {asgn.moduleTitle}
                </div>
              </div>

              {/* Status Chip */}
              <div className="shrink-0">
                {!latestSub ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EEE6D3] text-[#7A7160] border border-[#E1D8C2]">
                    <svg fill="none" height="13" viewBox="0 0 24 24" width="13" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                    <span>Not Submitted</span>
                  </span>
                ) : isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E4EEE8] text-[#1E4B3E] border border-[#1E4B3E]/30">
                    <svg fill="none" height="13" viewBox="0 0 24 24" width="13" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Approved</span>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#9A4230]/15 text-[#9A4230] border border-[#9A4230]/30">
                    <svg fill="none" height="13" viewBox="0 0 24 24" width="13" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <span>Revision Requested</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E7CE9C]/30 text-[#8C6425] border border-[#B4863A]/40">
                    <svg fill="none" height="13" viewBox="0 0 24 24" width="13" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                    <span>Under Review</span>
                  </span>
                )}
              </div>
            </div>

            {/* Brief Instructions */}
            <div className="bg-[#F6F1E6]/70 rounded-xl p-3.5 border border-[#E1D8C2]">
              <div className="text-[10.5px] font-bold text-[#7A7160] uppercase tracking-wider mb-1">
                Assignment Brief &amp; Deliverables
              </div>
              <p className="text-[13px] text-[#132242] leading-relaxed">
                {asgn.instructions}
              </p>
            </div>

            {/* Allowed Specs Tracker */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#F6F1E6] rounded-xl p-2.5 border border-[#E1D8C2] flex flex-col">
                <span className="text-[10px] text-[#7A7160] uppercase font-bold">Allowed Format</span>
                <span className="font-semibold text-[#132242] mt-0.5">
                  {asgn.allowedFileTypes.join(", ").toUpperCase()}
                </span>
              </div>

              <div className="bg-[#F6F1E6] rounded-xl p-2.5 border border-[#E1D8C2] flex flex-col">
                <span className="text-[10px] text-[#7A7160] uppercase font-bold">Max File Size</span>
                <span className="font-semibold text-[#8C6425] mt-0.5">
                  {asgn.maxFileSizeMb} MB
                </span>
              </div>
            </div>

            {/* Submission Log & Faculty Feedback */}
            {subList.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#E1D8C2]">
                <div className="text-[11px] font-bold text-[#7A7160] uppercase tracking-wider">
                  Submission History ({subList.length})
                </div>
                {subList.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="bg-[#F6F1E6] border border-[#E1D8C2] rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold bg-[#132242] text-[#F3EEE1] px-2 py-0.5 rounded-md shrink-0">
                          Submission #{subList.length - idx}
                        </span>
                        <span className="text-[12.5px] font-bold text-[#132242] truncate flex items-center gap-1">
                          <svg fill="none" height="13" viewBox="0 0 24 24" width="13" className="text-[#8C6425] shrink-0">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 13H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{sub.fileName || "Assignment_Submission.pdf"}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(sub.fileName)}
                        className="text-[11px] font-bold text-[#8C6425] hover:text-[#B4863A] flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <svg fill="none" height="13" viewBox="0 0 24 24" width="13" stroke="currentColor" strokeWidth="2">
                          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </div>

                    {sub.learnerNote && (
                      <p className="text-[11.5px] text-[#5A6786] italic bg-white/60 p-2 rounded-lg border border-[#E1D8C2]">
                        "{sub.learnerNote}"
                      </p>
                    )}

                    {sub.reviewerFeedback && (
                      <div className={`p-2.5 rounded-lg border text-[11.5px] font-medium leading-relaxed ${
                        sub.status === "approved"
                          ? "bg-[#E4EEE8] border-[#1E4B3E]/20 text-[#1E4B3E]"
                          : sub.status === "rejected" || sub.status === "resubmit"
                          ? "bg-[#9A4230]/10 border-[#9A4230]/30 text-[#9A4230]"
                          : "bg-[#E7CE9C]/20 border-[#B4863A]/30 text-[#8C6425]"
                      }`}>
                        <div className="flex items-center justify-between font-bold mb-0.5">
                          <span>Faculty Reviewer Feedback:</span>
                          {sub.score && <span className="bg-[#132242] text-white px-2 py-0.5 rounded text-[10.5px]">{sub.score}</span>}
                        </div>
                        <p>{sub.reviewerFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Lock Banner when Under Review */}
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
              <div className="p-3 bg-[#E4EEE8] rounded-xl border border-[#1E4B3E]/30 text-[12.5px] text-[#1E4B3E] font-medium flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1E4B3E] text-white flex items-center justify-center shrink-0 font-bold">
                  ✓
                </div>
                <span>This assignment has been reviewed and approved by YBB's deal grading committee.</span>
              </div>
            )}

            {/* Interactive Upload & Submission Form — ONLY unlocked if not submitted or if rejected by admin */}
            {canUploadNewAttempt && (
              <div className="flex flex-col gap-3 pt-3 border-t border-[#E1D8C2]">
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

                <div className="text-[11px] font-bold text-[#7A7160] uppercase tracking-wider">
                  Upload Your Assignment Work
                </div>

                {/* File Upload Box */}
                {!selectedFiles[asgn.id] ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E1D8C2] hover:border-[#B4863A] bg-[#F6F1E6]/50 hover:bg-[#F6F1E6] rounded-xl cursor-pointer transition-all text-center group">
                    <input
                      type="file"
                      accept={asgn.allowedFileTypes.map((t) => `.${t}`).join(",")}
                      onChange={(e) => handleFileChange(asgn.id, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-[#EEE6D3] group-hover:bg-[#E7CE9C]/50 text-[#8C6425] flex items-center justify-center mb-2 transition-colors">
                      <svg fill="none" height="20" viewBox="0 0 24 24" width="20" stroke="currentColor" strokeWidth="1.8">
                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-[12.5px] font-bold text-[#132242] group-hover:text-[#8C6425]">
                      Click to choose file or drag &amp; drop
                    </div>
                    <div className="text-[10.5px] text-[#7A7160] mt-0.5">
                      Accepts {asgn.allowedFileTypes.join(", ").toUpperCase()} up to {asgn.maxFileSizeMb} MB
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[#F6F1E6] border border-[#B4863A]/50 rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#B4863A]/15 text-[#8C6425] flex items-center justify-center shrink-0">
                        <svg fill="none" height="18" viewBox="0 0 24 24" width="18" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-bold text-[#132242] truncate">
                          {selectedFiles[asgn.id]?.name}
                        </div>
                        <div className="text-[10.5px] text-[#7A7160]">
                          {((selectedFiles[asgn.id]?.size || 0) / (1024 * 1024)).toFixed(2)} MB · Attached
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFiles((prev) => ({ ...prev, [asgn.id]: null }))
                      }
                      className="text-[11px] font-bold text-[#9A4230] hover:text-[#7A3022] px-2 py-1 rounded-lg hover:bg-[#9A4230]/10 transition-colors shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Optional Note Textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-[#7A7160] uppercase tracking-wider mb-1">
                    Optional Note for Faculty Reviewer
                  </label>
                  <textarea
                    rows={2}
                    value={notes[asgn.id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [asgn.id]: e.target.value }))
                    }
                    placeholder="Add executive summary or note for your reviewer..."
                    className="w-full bg-[#F6F1E6] border border-[#E1D8C2] rounded-lg p-2.5 text-[12.5px] outline-none focus:border-[#B4863A] transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmitAssignment(asgn)}
                  className="w-full bg-gradient-to-r from-[#132242] via-[#1C2E56] to-[#132242] text-[#E7CE9C] font-bold text-[13.5px] py-3 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#B4863A]/40 mt-1"
                >
                  <svg fill="none" height="17" viewBox="0 0 24 24" width="17" stroke="currentColor" strokeWidth="2" className="text-[#E7CE9C]">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Submit Assignment for Faculty Review</span>
                </button>
              </div>
            )}
          </div>
        );
      }))}
    </div>
  );
};
