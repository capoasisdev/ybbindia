import React from "react";
import { useApp } from "../../context/AppContext";
import { TabBar } from "../../components/ui/TabBar";

/**
 * EnrolledHomeScreen — shown ONLY to enrolled users.
 * Fully independent from the guest home. Edit freely without
 * affecting the non-enrolled experience.
 */
export const EnrolledHomeScreen: React.FC = () => {
  const { user, navigateTo, selectLesson, certificate, notifications, modules } = useApp();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const latestUnread = notifications.find((n) => !n.isRead);

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.isComplete).length,
    0
  );
  const completedModules = modules.filter((m) => m.status === "completed").length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const currentModule = modules.find((m) => m.status === "in_progress") || modules[0];
  const currentLesson =
    currentModule?.lessons.find((l) => !l.isComplete) || currentModule?.lessons[0];

  const upcomingModules = modules
    .filter((m) => m.id !== currentModule?.id && m.status !== "completed")
    .slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleContinueLearning = () => {
    if (currentModule && currentLesson) {
      selectLesson(currentModule.id, currentLesson.id);
    } else {
      navigateTo("learn");
    }
  };

  const handleOpenModule = (modId: string) => {
    const mod = modules.find((m) => m.id === modId);
    if (!mod) return;
    if (mod.status === "locked") {
      return;
    }
    const firstIncomplete = mod.lessons.find((l) => !l.isComplete) || mod.lessons[0];
    if (firstIncomplete) selectLesson(mod.id, firstIncomplete.id);
  };

  const moduleMinutes = (modId: string) => {
    const mod = modules.find((m) => m.id === modId);
    if (!mod) return 0;
    return Math.round(mod.lessons.reduce((a, l) => a + l.durationSeconds, 0) / 60);
  };

  const allDone = totalLessons > 0 && completedLessons === totalLessons;

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none overflow-hidden">
      {/* Scrollable content area with safe-top padding */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-5 safe-top pb-6 flex flex-col gap-3.5 sm:gap-4 w-full max-w-full">
        {/* Header greeting */}
        <div className="flex justify-between items-center pt-0.5 w-full shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <div className="text-[12px] sm:text-[12.5px] text-[#7A7160] font-medium tracking-wide">
              {getGreeting()}
            </div>
            <div className="font-serif font-bold text-[22px] sm:text-[24px] leading-tight text-[#132242] mt-0.5 tracking-tight antialiased truncate">
              {user?.name || (user?.email ? user.email.split("@")[0] : "Learner")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo("notifications")}
            className="w-9 h-9 rounded-full bg-[#EEE6D3] hover:bg-[#E5DCB6] flex items-center justify-center text-[#132242] active:scale-90 transition-all relative shrink-0 shadow-xs"
            aria-label="Notifications"
          >
            <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
              <path
                d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#132242"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M13.7 21a2 2 0 01-3.4 0"
                stroke="#132242"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#9A4230] rounded-full ring-2 ring-[#F6F1E6] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Certificate Earned Celebration Card */}
        {certificate && (
          <div className="w-full shrink-0 bg-gradient-to-r from-[#1E4B3E] to-[#143229] rounded-[20px] sm:rounded-[22px] p-4 sm:p-5 text-[#F3EEE1] shadow-md border border-[#2E6B5A] relative overflow-hidden">
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#E7CE9C]/15 border border-[#E7CE9C]/30 flex items-center justify-center shrink-0 shadow-inner">
                <svg fill="none" height="24" viewBox="0 0 24 24" width="24" className="text-[#E7CE9C]">
                  <circle cx="12" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 13l-2 8 5-2.5 5 2.5-2-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 8.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif font-bold text-[16px] sm:text-[17px] leading-snug text-[#FFFDF8]">
                  You are a certified ABB
                </div>
                <div className="text-[12px] text-[#D1D9CE] mt-0.5 font-mono font-medium truncate flex items-center gap-1.5">
                  <span className="text-[#E7CE9C] text-[10px]">●</span>
                  <span>ABB ID:</span>
                  <span className="text-[#E7CE9C] font-bold">{certificate.abbId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigateTo("certificate")}
                className="shrink-0 py-2.5 px-4 rounded-xl bg-[#E7CE9C] hover:bg-[#DFC48F] active:bg-[#D4B77E] text-[#132242] font-bold text-[12px] shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span>View</span>
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Progress Card - Navy, Refined */}
        <div className="w-full shrink-0 rounded-[20px] sm:rounded-[22px] p-4 sm:p-5 shadow-xs border bg-[#132242] text-[#F3EEE1] border-[#1F3363]">
          <div className="flex justify-between items-center mb-3">
            <div className="font-serif italic font-bold text-[15px] sm:text-[16px] leading-tight">
              Your ABB journey
            </div>
            <span className="pill text-[10.5px] sm:text-[11px] font-bold shrink-0 !bg-[#E7CE9C] !text-[#8C6425]">
              {progressPercent}% Completed
            </span>
          </div>

          <div className="h-2.5 rounded-full overflow-hidden mb-3 w-full bg-white/15">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[#B4863A]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-[11.5px] font-medium text-[#B9C0D6]">
            <span className="truncate flex-1 min-w-0">
              {completedModules} of {modules.length} modules completed
            </span>
            <span className="shrink-0 text-[#E7CE9C]">{user?.daysRemaining ?? 365} days left</span>
          </div>
        </div>

        {/* Continue Learning Card — primary action */}
        {currentModule && !allDone && (
          <div className="w-full shrink-0">
            <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-0.5">
              Continue learning
            </div>
            <div
              onClick={handleContinueLearning}
              className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-3 sm:p-3.5 flex gap-3 items-center cursor-pointer hover:border-[#B4863A] active:scale-[0.99] transition-all shadow-xs"
            >
              <div className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#132242] text-[#E7CE9C]">
                <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" className="ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] sm:text-[13.5px] font-bold text-[#132242] truncate">
                  Module {currentModule.number < 10 ? `0${currentModule.number}` : currentModule.number} · {currentModule.title}
                </div>
                <div className="text-[11px] sm:text-[11.5px] text-[#7A7160] mt-0.5 truncate">
                  {currentLesson?.title || "Next lesson in sequence"}
                </div>
              </div>
              <svg fill="none" height="16" viewBox="0 0 24 24" width="16" className="text-[#B4863A] shrink-0 mr-0.5">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
            </div>
          </div>
        )}

        {/* Practical Evaluation / Assignments Card */}
        <div className="w-full shrink-0">
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-0.5">
            Practical Evaluation
          </div>
          <div
            onClick={() => navigateTo("assignment")}
            className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-3 sm:p-3.5 flex gap-3 items-center cursor-pointer hover:border-[#B4863A] active:scale-[0.99] transition-all shadow-xs"
          >
            <div className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#B4863A]/15 text-[#8C6425] border border-[#B4863A]/30">
              <svg fill="none" height="22" viewBox="0 0 24 24" width="22" className="text-[#8C6425]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 13H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] sm:text-[13.5px] font-bold text-[#132242] truncate">
                Module &amp; Capstone Assignments
              </div>
              <div className="text-[11px] sm:text-[11.5px] text-[#7A7160] mt-0.5 truncate">
                Submit deal models, teasers &amp; view faculty grades
              </div>
            </div>
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16" className="text-[#B4863A] shrink-0 mr-0.5">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full">
          <div
            onClick={() => navigateTo("learn")}
            className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 cursor-pointer hover:border-[#B4863A] active:scale-95 transition-all shadow-xs flex flex-col items-center justify-between gap-1.5 min-h-[94px] sm:min-h-[98px]"
          >
            <div className="w-7 h-7 rounded-full bg-[#F6F1E6] border border-[#E1D8C2] flex items-center justify-center text-[#8C6425] shrink-0">
              <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="font-serif font-semibold text-[15px] sm:text-[16px] text-[#132242] leading-none truncate w-full text-center">
              {completedLessons}/{totalLessons}
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-[#7A7160] font-medium leading-tight text-center">Lessons Done</div>
          </div>

          <div
            onClick={() => navigateTo("exam")}
            className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 cursor-pointer hover:border-[#B4863A] active:scale-95 transition-all shadow-xs flex flex-col items-center justify-between gap-1.5 min-h-[94px] sm:min-h-[98px]"
          >
            <div className="w-7 h-7 rounded-full bg-[#F6F1E6] border border-[#E1D8C2] flex items-center justify-center text-[#8C6425] shrink-0">
              <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div className="font-serif font-semibold text-[15px] sm:text-[16px] text-[#132242] leading-none w-full text-center">
              80%
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-[#7A7160] font-medium leading-tight text-center">Exam Pass Mark</div>
          </div>

          <div
            onClick={() => navigateTo("certificate")}
            className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 cursor-pointer hover:border-[#B4863A] active:scale-95 transition-all shadow-xs flex flex-col items-center justify-between gap-1.5 min-h-[94px] sm:min-h-[98px]"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                certificate
                  ? "bg-[#1E4B3E] text-white"
                  : "bg-[#F6F1E6] border border-[#E1D8C2] text-[#8C6425]"
              }`}
            >
              {certificate ? (
                <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                  <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8.8 13.5L7 21l5-2.5L17 21l-1.8-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="font-serif font-semibold text-[13px] sm:text-[14px] text-[#132242] leading-none truncate w-full text-center">
              {certificate ? "Earned" : "In Progress"}
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-[#7A7160] font-medium leading-tight text-center">Certificate</div>
          </div>
        </div>

        {/* Up Next Modules */}
        {upcomingModules.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase">
                Up next
              </div>
              <button
                type="button"
                onClick={() => navigateTo("learn")}
                className="text-[10.5px] font-bold text-[#8C6425] hover:text-[#B4863A] transition-colors"
              >
                View all
              </button>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {upcomingModules.map((m) => {
                const isDone = m.status === "completed";
                const isActive = m.status === "in_progress";
                const mins = moduleMinutes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleOpenModule(m.id)}
                    className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 flex gap-3 items-center cursor-pointer hover:border-[#B4863A] active:scale-[0.99] transition-all shadow-xs"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-serif font-bold text-[12.5px] ${
                        isDone
                          ? "bg-[#1E4B3E]/10 text-[#1E4B3E] border border-[#1E4B3E]/20"
                          : isActive
                          ? "bg-[#132242] text-[#E7CE9C]"
                          : "bg-[#EEE6D3] text-[#7A7160]"
                      }`}
                    >
                      {m.number < 10 ? `0${m.number}` : m.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] sm:text-[13px] font-bold text-[#132242] truncate">
                        {m.title}
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] text-[#7A7160] mt-0.5">
                        {m.lessons.length} lessons{mins > 0 ? ` · ~${mins} min` : ""}
                      </div>
                    </div>
                    {m.status === "locked" ? (
                      <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160] shrink-0">
                        <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
                        <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    ) : (
                      <svg fill="none" height="15" viewBox="0 0 24 24" width="15" className="text-[#B4863A] shrink-0">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Latest Update — notification preview */}
        {latestUnread && (
          <div className="w-full">
            <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-0.5">
              Latest update
            </div>
            <div
              onClick={() => navigateTo("notifications")}
              className="w-full bg-gradient-to-r from-[#FFFDF8] to-[#FAF6ED] border border-[#E2D4BD] rounded-[16px] p-3 flex gap-3 items-center cursor-pointer hover:border-[#B4863A] active:scale-[0.99] transition-all shadow-xs relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B4863A]" />
              <div className="w-9 h-9 rounded-lg bg-[#B4863A]/15 border border-[#B4863A]/25 text-[#8C6425] flex items-center justify-center shrink-0 ml-1">
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path
                    d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                  <path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12.5px] font-bold text-[#132242] truncate">
                    {latestUnread.title}
                  </span>
                  <span className="w-1.5 h-1.5 bg-[#9A4230] rounded-full shrink-0" />
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-[#7A7160] truncate mt-0.5">
                  {latestUnread.message}
                </div>
              </div>
              <svg fill="none" height="15" viewBox="0 0 24 24" width="15" className="text-[#B4863A] shrink-0 mr-0.5">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
            </div>
          </div>
        )}

        {/* Programme Stages */}
        <div className="w-full">
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-3 px-0.5">
            Programme stages
          </div>
          <div className="flex justify-between px-1 sm:px-2 w-full">
            <div className="text-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 shadow-xs ${
                  completedModules > 0 ? "bg-[#1E4B3E] text-white" : "bg-[#B4863A] text-[#2A1D07]"
                }`}
              >
                {completedModules > 0 ? (
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  "01"
                )}
              </div>
              <div className="text-[10px] text-[#132242] font-bold">Learn</div>
            </div>

            <div className="text-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 shadow-xs ${
                  completedModules >= 6
                    ? "bg-[#1E4B3E] text-white"
                    : completedModules > 0
                    ? "bg-[#B4863A] text-[#2A1D07]"
                    : "bg-[#EEE6D3] text-[#7A7160]"
                }`}
              >
                {completedModules >= 6 ? (
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  "02"
                )}
              </div>
              <div className="text-[10px] text-[#7A7160] font-medium">Apply</div>
            </div>

            <div className="text-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 ${
                  completedModules === modules.length && modules.length > 0
                    ? "bg-[#1E4B3E] text-white"
                    : "bg-[#EEE6D3] text-[#7A7160]"
                }`}
              >
                {completedModules === modules.length && modules.length > 0 ? (
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  "03"
                )}
              </div>
              <div className="text-[10px] text-[#7A7160] font-medium">Qualify</div>
            </div>

            <div className="text-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 ${
                  certificate ? "bg-[#1E4B3E] text-white" : "bg-[#EEE6D3] text-[#7A7160]"
                }`}
              >
                {certificate ? (
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  "04"
                )}
              </div>
              <div className="text-[10px] text-[#7A7160] font-medium">Certified</div>
            </div>
          </div>
        </div>

        {/* Footer tagline */}
        <div className="pt-1 pb-1 text-center w-full">
          <div className="text-[9.5px] sm:text-[10px] text-[#7A7160]/70 font-medium tracking-wide">
            YBB India · Authorised Business Broker Programme
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
};
