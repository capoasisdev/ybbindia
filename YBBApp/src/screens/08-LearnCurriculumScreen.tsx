import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { TabBar } from "../components/ui/TabBar";

export const LearnCurriculumScreen: React.FC = () => {
  const { modules, selectLesson, showToast, user, navigateTo } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const isEnrolled = Boolean(user?.isEnrolled);
  const completedModulesCount = isEnrolled ? modules.filter((m) => m.status === "completed").length : 0;
  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessonsCount = isEnrolled
    ? modules.reduce((acc, m) => acc + m.lessons.filter((l) => l.isComplete).length, 0)
    : 0;
  const progressPercent =
    isEnrolled && totalLessonsCount > 0
      ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
      : 0;

  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.number).includes(searchQuery)
  );

  const handleModuleClick = (modId: string) => {
    if (!isEnrolled) {
      showToast("Please enrol in the ABB programme to access course modules", "info");
      navigateTo("enrol");
      return;
    }

    const mod = modules.find((m) => m.id === modId);
    if (!mod) return;

    if (mod.status === "locked") {
      showToast(`Module ${mod.number} is locked. Complete earlier modules first.`, "info");
      return;
    }

    const firstIncomplete = mod.lessons.find((l) => !l.isComplete) || mod.lessons[0];
    selectLesson(mod.id, firstIncomplete.id);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
      <TopBar
        title="Curriculum"
        rightElement={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo("assignment")}
              className="px-2.5 py-1.5 rounded-full bg-[#132242] text-[#F3EEE1] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#1C2E56] transition-colors shadow-xs cursor-pointer"
            >
              <svg fill="none" height="12" viewBox="0 0 24 24" width="12" className="text-[#E7CE9C]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Assignments</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 rounded-full bg-[#EEE6D3] flex items-center justify-center text-[#132242] hover:bg-[#E1D8C2] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <svg fill="none" height="15" viewBox="0 0 24 24" width="15">
                <circle cx="11" cy="11" r="7" stroke="#132242" strokeWidth="1.8" />
                <path
                  d="M21 21l-4.3-4.3"
                  stroke="#132242"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>
        }
      />

      {/* Search Input Bar */}
      {showSearch && (
        <div className="px-5 pt-2 pb-1 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules or lessons..."
            className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-[#B4863A]"
            autoFocus
          />
        </div>
      )}

      {/* Enrolment Required Callout for Non-Enrolled Users */}
      {!isEnrolled && (
        <div className="px-4 sm:px-5 pt-3 pb-1 shrink-0 w-full max-w-full">
          <div className="bg-[#132242] rounded-2xl p-3.5 sm:p-4 text-[#F3EEE1] shadow-sm flex items-center justify-between gap-2.5 sm:gap-3 border border-[#E7CE9C]/20 w-full">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-[#E7CE9C] tracking-wider uppercase mb-0.5">
                Enrolment Required
              </div>
              <div className="text-[11.5px] sm:text-[12px] text-[#B9C0D6] leading-snug">
                Enrol now to unlock video lessons, workbooks &amp; assignments.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("enrol")}
              className="btn btn-primary text-[12px] py-2 px-3 shrink-0 shadow-xs whitespace-nowrap"
            >
              Enrol Now
            </button>
          </div>
        </div>
      )}

      {/* Overall Progress Tracker */}
      <div className="px-5 pt-3 pb-3 shrink-0">
        <div className="flex justify-between text-[11.5px] text-[#7A7160] mb-2 font-medium">
          <span>
            {isEnrolled
              ? `${completedModulesCount} of ${modules.length} modules complete (${completedLessonsCount}/${totalLessonsCount} lessons)`
              : `12 Modules · Enrolment Required`}
          </span>
          <span className="font-mono font-semibold text-[#132242]">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-[#EEE6D3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#B4863A] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Scrollable Modules List with REAL completion states */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-1">
        {filteredModules.map((mod) => {
          const isCompleted = mod.status === "completed";
          const isInProgress = mod.status === "in_progress";
          const isLocked = mod.status === "locked";

          const completedCount = mod.lessons.filter((l) => l.isComplete).length;

          return (
            <div
              key={mod.id}
              onClick={() => handleModuleClick(mod.id)}
              className={`flex gap-3.5 items-center py-3.5 px-1 border-b border-[#E1D8C2] cursor-pointer hover:bg-black/[0.02] active:bg-black/[0.04] transition-all ${
                isLocked ? "opacity-60" : ""
              }`}
            >
              {/* Badge Icon */}
              {isCompleted ? (
                <div className="w-[30px] h-[30px] rounded-full bg-[#1E4B3E] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : isInProgress ? (
                <div className="w-[30px] h-[30px] rounded-full bg-[#B4863A] text-[#2A1D07] flex items-center justify-center text-[11px] font-bold shrink-0 shadow-xs">
                  {mod.number < 10 ? `0${mod.number}` : mod.number}
                </div>
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-[#EEE6D3] flex items-center justify-center shrink-0 text-[#7A7160]">
                  <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                    <rect
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      width="14"
                      x="5"
                      y="10"
                    />
                    <path
                      d="M8 10V7a4 4 0 018 0v3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              )}

              {/* Module Text Details */}
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-bold text-[#132242] truncate">
                  {mod.number < 10 ? `0${mod.number}` : mod.number} · {mod.title}
                </div>
                <div className="text-[11.5px] mt-0.5">
                  {isCompleted ? (
                    <span className="text-[#1E4B3E] font-medium flex items-center gap-1">
                      <span>All {mod.lessons.length} lessons completed</span>
                      <svg fill="none" height="12" viewBox="0 0 24 24" width="12" className="inline">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  ) : isInProgress ? (
                    <span className="text-[#8C6425] font-semibold">
                      {completedCount} of {mod.lessons.length} lessons completed
                    </span>
                  ) : (
                    <span className="text-[#7A7160]">
                      {mod.lessons.length} lessons · Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TabBar />
    </div>
  );
};
