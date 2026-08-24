import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { EXAM_QUESTIONS } from "../lib/examData";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { fetchExamEligibilityAndQuestions, submitExamAttemptRecord } from "../lib/api";
import confetti from "canvas-confetti";

export const ExamScreen: React.FC = () => {
  const { navigateTo, user, setCertificate, showToast, modules } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState(3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState<number | null>(null);
  const [isPassed, setIsPassed] = useState<boolean | null>(null);
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>(EXAM_QUESTIONS);

  // Load real exam eligibility from Supabase
  useEffect(() => {
    let isMounted = true;
    async function checkEligibility() {
      const data = await fetchExamEligibilityAndQuestions(user?.id);
      if (isMounted && data) {
        setEligibilityData(data);
        if (data.questions && data.questions.length > 0) {
          const mapped = data.questions.map((q: any, qIdx: number) => {
            const rawOpts = Array.isArray(q.options) ? q.options : [];
            const opts = rawOpts.map((o: any, idx: number) => {
              if (typeof o === "object" && o !== null && "text" in o) {
                return { id: o.id || String(idx), text: o.text };
              }
              return { id: String.fromCharCode(97 + idx), text: String(o) };
            });
            return {
              id: q.id,
              text: q.prompt,
              options: opts,
              correctOptionId: q.correct_option_ids?.[0] || opts[0]?.id || "a",
              explanation: q.explanation || "Official ABB Examination Answer",
              moduleNumber: qIdx + 1,
            };
          });
          setExamQuestions(mapped);
        }
      }
    }
    checkEligibility();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Eligibility: All curriculum modules must be completed or staff approved
  const completedModulesCount = modules.filter((m) => m.status === "completed").length;
  const totalLessonsCount = eligibilityData?.lessonsTotal || modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessonsCount = eligibilityData?.lessonsCompleted || modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.isComplete).length,
    0
  );
  const assignmentsApprovedCount = eligibilityData?.assignmentsApproved || 0;
  const assignmentsTotalCount = eligibilityData?.assignmentsTotal || 50;

  const isEligible = eligibilityData?.canStartExam || (modules.length > 0 && completedModulesCount === modules.length);
  const curriculumProgressPct =
    totalLessonsCount > 0
      ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
      : 0;

  useEffect(() => {
    if (!isEligible || isSubmitted || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds, isSubmitted, isEligible]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  const currentQuestion = examQuestions[currentIdx] || examQuestions[0];
  const progressPercent = Math.round(((currentIdx + 1) / examQuestions.length) * 100);

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIdx < examQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleSubmitExam();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitExam = async () => {
    let correctCount = 0;
    examQuestions.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        correctCount += 1;
      }
    });

    const total = examQuestions.length;
    const calcScore = Math.round((correctCount / total) * 100);
    const passed = calcScore >= 80;

    setScorePercent(calcScore);
    setIsPassed(passed);
    setIsSubmitted(true);

    if (user?.id) {
      await submitExamAttemptRecord(
        user.id,
        "course-abb-primary",
        answers,
        calcScore,
        correctCount,
        total,
        passed
      );
    }

    if (passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      const abbId = user?.abbId || `YBB-ABB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

      const newCert = {
        id: "cert-" + Date.now(),
        abbId: abbId,
        userId: user?.id || "learner-123",
        learnerName: user?.name || "Authorised Business Broker",
        programmeName: "Authorised Business Broker (ABB)",
        issuedAt: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: "Active" as const,
      };

      setCertificate(newCert);

      try {
        if (user?.id) {
          await supabaseAdmin.from("certificates").upsert(
            {
              abb_id: abbId,
              user_id: user.id,
              learner_name: user.name || "Authorised Business Broker",
              programme_name: "Authorised Business Broker (ABB)",
              issued_at: new Date().toISOString(),
              status: "active",
            },
            { onConflict: "user_id" }
          );
        }
      } catch (dbErr) {
        console.warn("Could not save certificate to Supabase:", dbErr);
      }
    }
  };

  // -------------------------------------------------------------
  // LOCKED / INELIGIBLE VIEW
  // -------------------------------------------------------------
  if (!isEligible) {
    return (
      <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
        <TopBar title="Final Examination" showBack={true} />

        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center">
            {/* Lock Shield Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#0E1730] text-[#E7CE9C] flex items-center justify-center mb-4 shadow-md">
              <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              </svg>
            </div>

            <h1 className="font-serif font-bold text-[22px] text-[#132242] mb-2 leading-snug">
              Examination Locked
            </h1>
            <p className="text-[13px] text-[#7A7160] leading-relaxed max-w-xs mb-6">
              The ABB Certification Final Exam unlocks once you finish all 11 curriculum modules and their practical assignments.
            </p>

            {/* Curriculum Progress Card */}
            <div className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-4 shadow-xs text-left mb-5">
              <div className="flex justify-between items-center text-[12px] font-bold text-[#132242] mb-2">
                <span>Curriculum Progress</span>
                <span className="text-[#8C6425] font-mono">{curriculumProgressPct}%</span>
              </div>
              <div className="h-2.5 bg-[#EEE6D3] rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-[#B4863A] rounded-full transition-all duration-300"
                  style={{ width: `${curriculumProgressPct}%` }}
                />
              </div>
              <div className="text-[11.5px] text-[#7A7160]">
                {completedModulesCount} of {modules.length} modules completed ({completedLessonsCount}/{totalLessonsCount} lessons)
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="w-full flex flex-col gap-2.5 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7160] px-1">
                Eligibility Requirements
              </div>

              {/* Requirement 1: Enrolment */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFDF8] border border-[#E1D8C2]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    user?.isEnrolled
                      ? "bg-[#1E4B3E] text-white"
                      : "bg-[#EEE6D3] text-[#7A7160]"
                  }`}
                >
                  {user?.isEnrolled ? (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#132242]">
                    Programme Enrolment
                  </div>
                  <div className="text-[11px] text-[#7A7160]">
                    {user?.isEnrolled ? "Active Enrolment Confirmed" : "Enrolment Required"}
                  </div>
                </div>
              </div>

              {/* Requirement 2: All Lessons Complete */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFDF8] border border-[#E1D8C2]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    completedLessonsCount >= totalLessonsCount && totalLessonsCount > 0
                      ? "bg-[#1E4B3E] text-white"
                      : "bg-[#EEE6D3] text-[#7A7160]"
                  }`}
                >
                  {completedLessonsCount >= totalLessonsCount && totalLessonsCount > 0 ? (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#132242]">
                    Complete All Lessons
                  </div>
                  <div className="text-[11px] text-[#7A7160]">
                    {completedLessonsCount} / {totalLessonsCount} lessons complete
                  </div>
                </div>
              </div>

              {/* Requirement 3: All Assignments Approved */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFDF8] border border-[#E1D8C2]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    assignmentsApprovedCount >= assignmentsTotalCount && assignmentsTotalCount > 0
                      ? "bg-[#1E4B3E] text-white"
                      : "bg-[#EEE6D3] text-[#7A7160]"
                  }`}
                >
                  {assignmentsApprovedCount >= assignmentsTotalCount && assignmentsTotalCount > 0 ? (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#132242]">
                    Approve All Practical Assignments
                  </div>
                  <div className="text-[11px] text-[#7A7160]">
                    {assignmentsApprovedCount} / {assignmentsTotalCount} assignments approved
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Action Button */}
            <div className="pt-6 pb-4">
              <button
                type="button"
                onClick={() => navigateTo(user?.isEnrolled ? "learn" : "enrol")}
                className="btn btn-primary w-full text-[14px] flex items-center justify-center gap-2 shadow-xs"
              >
                <span>{user?.isEnrolled ? "Continue Curriculum" : "Enrol in Programme"}</span>
                <svg fill="none" height="15" viewBox="0 0 24 24" width="15">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE EXAMINATION VIEW
  // -------------------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden relative">
      <TopBar
        title="ABB Final Examination"
        showBack={true}
        rightElement={
          <div className="flex items-center gap-1.5 bg-[#132242] text-[#E7CE9C] px-3 py-1 rounded-full shadow-xs">
            <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-[11.5px] font-bold">
              {formatTimer(timerSeconds)}
            </span>
          </div>
        }
      />

      {/* Progress Header */}
      <div className="px-5 pt-3.5 pb-2 shrink-0">
        <div className="flex justify-between text-[12px] text-[#7A7160] mb-2 font-medium">
          <span>Question {currentIdx + 1} of {EXAM_QUESTIONS.length}</span>
          <span>70% required to pass</span>
        </div>
        <div className="h-2 bg-[#EEE6D3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#132242] rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question & Options Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#132242] leading-[1.5] mb-5">
            {currentQuestion.text || currentQuestion.question}
          </h2>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt: { id: string; text: string }) => {
              const isSelected = answers[currentQuestion.id] === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-4 rounded-xl text-[13px] leading-snug cursor-pointer transition-all border ${
                    isSelected
                      ? "border-[#8C6425] bg-[#E7CE9C] font-bold text-[#132242] shadow-xs"
                      : "border-[#E1D8C2] bg-[#FFFDF8] text-[#132242] hover:border-[#B4863A]"
                  }`}
                >
                  {opt.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 pb-6">
          <div className="flex gap-2.5">
            {currentIdx > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn btn-ghost w-28 text-[13.5px] flex items-center justify-center gap-1.5"
              >
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Prev</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary flex-1 text-[14px] flex items-center justify-center gap-1.5"
            >
              <span>
                {currentIdx === EXAM_QUESTIONS.length - 1
                  ? "Submit Examination"
                  : "Next Question"}
              </span>
              {currentIdx < EXAM_QUESTIONS.length - 1 && (
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-[#7A7160] mt-3">
            Answers save automatically
          </p>
        </div>
      </div>

      {/* Exam Result Modal */}
      {isSubmitted && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
            <div
              className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                isPassed ? "bg-[#E4EEE8] text-[#1E4B3E]" : "bg-[#F3E1DB] text-[#9A4230]"
              }`}
            >
              {isPassed ? (
                <svg fill="none" height="26" viewBox="0 0 24 24" width="26">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>

            <h3 className="font-serif font-semibold text-[20px] mb-1 text-[#132242]">
              {isPassed ? "Congratulations!" : "Exam Finished"}
            </h3>

            <p className="text-[13px] text-[#7A7160] mb-4">
              {isPassed
                ? "You scored above the 70% threshold and passed the examination!"
                : "You did not meet the 70% passing threshold."}
            </p>

            <div className="bg-[#EEE6D3] rounded-xl p-3.5 mb-5">
              <div className="text-[11px] text-[#7A7160] uppercase tracking-wider font-semibold">
                Your Score
              </div>
              <div className="font-serif font-bold text-[30px] text-[#132242] my-0.5">
                {scorePercent}%
              </div>
              <div className="text-[11px] text-[#7A7160]">
                {isPassed ? "Status: Passed" : "Status: Needs Reattempt"}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {isPassed ? (
                <button
                  type="button"
                  onClick={() => navigateTo("certificate")}
                  className="btn btn-brass text-[14px] flex items-center justify-center gap-1.5"
                >
                  <span>View Your Certificate</span>
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentIdx(0);
                    setTimerSeconds(3600);
                  }}
                  className="btn btn-primary text-[14px]"
                >
                  Retake Exam
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTo("home")}
                className="btn btn-ghost text-[13.5px]"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
