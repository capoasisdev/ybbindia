import React from "react";
import { useApp } from "../../context/AppContext";
import { TabBar } from "../../components/ui/TabBar";

/**
 * GuestHomeScreen — shown ONLY to non-enrolled users.
 * Fully independent from the enrolled home. Edit freely without
 * affecting the enrolled experience.
 */
export const GuestHomeScreen: React.FC = () => {
  const { user, navigateTo, notifications, modules, showToast } = useApp();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const latestUnread = notifications.find((n) => !n.isRead);

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalMinutes = Math.round(
    modules.reduce((acc, m) => acc + m.lessons.reduce((a, l) => a + l.durationSeconds, 0), 0) / 60
  );
  const totalHours = Math.max(1, Math.round(totalMinutes / 60));

  const previewModules = modules.slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const guardEnrolment = (message: string) => {
    showToast(message, "info");
    navigateTo("enrol");
  };

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
            className="w-9 h-9 rounded-full bg-[#EEE6D3] hover:bg-[#E5DCB6] flex items-center justify-center text-[#132242] active:scale-90 transition-all relative shrink-0 shadow-xs cursor-pointer"
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

        {/* Hero Banner - Soft, Warm & Premium Luxury Card */}
        <div className="w-full shrink-0 bg-gradient-to-br from-[#FFFDF8] via-[#FAF6ED] to-[#F5ECE0] rounded-[20px] p-4 sm:p-5 text-[#132242] shadow-lift relative overflow-hidden border border-[#E2D4BD]">
          {/* Decorative accent */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#B4863A]/15 rounded-full blur-xl pointer-events-none" />

          {/* Badge row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B4863A]/15 border border-[#B4863A]/30 text-[#8C6425] text-[10.5px] font-bold tracking-wide whitespace-nowrap shrink-0">
              <span className="text-[#B4863A]">✦</span>
              <span>Enrolment Required</span>
            </div>
            <span className="text-[10.5px] font-bold text-[#8C6425] bg-[#E7CE9C]/40 border border-[#B4863A]/25 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
              365-Day Access
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-serif font-bold text-[18px] sm:text-[20px] text-[#132242] mb-1 leading-tight tracking-tight relative z-10">
            Unlock the ABB Certification
          </h2>
          <p className="text-[12px] text-[#6E6453] mb-3.5 leading-snug relative z-10 font-normal">
            {modules.length} Modules · Valuation Models · Workbooks · Exam
          </p>

          {/* Feature pills — 3-column crisp layout */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 relative z-10">
            {[
              { label: `${modules.length} Modules` },
              { label: "Final Exam" },
              { label: "Certificate" },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-white/90 backdrop-blur-xs px-2 py-1.5 rounded-lg border border-[#E2D4BD] text-center shadow-xs flex items-center justify-center gap-1 min-w-0"
              >
                <span className="text-[10px] font-bold text-[#1E4B3E] shrink-0">✓</span>
                <span className="text-[10px] sm:text-[11px] text-[#132242] font-semibold truncate min-w-0">
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigateTo("enrol")}
            className="w-full py-2.5 sm:py-3 px-4 rounded-[12px] bg-[#132242] text-[#FFFDF8] hover:bg-[#1C2E56] active:scale-[0.98] transition-all shadow-md font-bold text-[13px] sm:text-[14px] flex items-center justify-center gap-2 relative z-10 cursor-pointer"
          >
            <span className="whitespace-nowrap">Enrol &amp; Unlock Course</span>
            <svg className="w-4 h-4 text-[#E7CE9C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Enrolment Status Card */}
        <div className="w-full shrink-0 bg-[#FFFDF8] text-[#132242] border border-[#E1D8C2] rounded-[20px] sm:rounded-[22px] p-4 sm:p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div className="font-serif italic font-bold text-[15px] sm:text-[16px] leading-tight">
              Your ABB journey
            </div>
            <span className="pill text-[10.5px] sm:text-[11px] font-bold shrink-0 !bg-[#EEE6D3] !text-[#7A7160]">
              Enrolment Pending
            </span>
          </div>

          <div className="h-2.5 rounded-full overflow-hidden mb-3 w-full bg-[#EEE6D3]">
            <div className="h-full rounded-full w-0 bg-[#B4863A]/40" />
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-[11.5px] font-medium text-[#7A7160]">
            <span className="truncate flex-1 min-w-0">Unlock all learning modules</span>
            <span className="shrink-0 text-[#8C6425] font-semibold">Ready to Enrol</span>
          </div>
        </div>

        {/* Curriculum Access Card */}
        <div className="w-full shrink-0">
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-0.5">
            Curriculum access
          </div>
          <div
            onClick={() => guardEnrolment("Please enrol in the ABB programme to start learning")}
            className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-3 sm:p-3.5 flex gap-3 items-center cursor-pointer hover:border-[#B4863A] active:scale-[0.99] transition-all shadow-xs"
          >
            <div className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#EEE6D3] text-[#7A7160]">
              <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
                <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] sm:text-[13.5px] font-bold text-[#132242] truncate">
                {modules.length} Course Modules Locked
              </div>
              <div className="text-[11px] sm:text-[11.5px] text-[#7A7160] mt-0.5 truncate">
                Enrol in the ABB programme to unlock all video lessons
              </div>
            </div>
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16" className="text-[#B4863A] shrink-0 mr-0.5">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </div>
        </div>

        {/* Locked Stat Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full shrink-0">
          <div
            onClick={() => guardEnrolment("Please enrol in the course to view lessons")}
            className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 cursor-pointer hover:border-[#B4863A] active:scale-95 transition-all shadow-xs flex flex-col items-center justify-between gap-1.5 min-h-[94px] sm:min-h-[98px]"
          >
            <div className="w-7 h-7 rounded-full bg-[#F6F1E6] border border-[#E1D8C2] flex items-center justify-center text-[#8C6425] shrink-0">
              <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="font-serif font-semibold text-[15px] sm:text-[16px] text-[#132242] leading-none w-full text-center">
              Locked
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-[#7A7160] font-medium leading-tight text-center">Lessons Done</div>
          </div>

          <div
            onClick={() => guardEnrolment("Please enrol to qualify for the final exam")}
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
              70%
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-[#7A7160] font-medium leading-tight text-center">Exam Pass Mark</div>
          </div>

          <div
            onClick={() => guardEnrolment("Enrol and pass the exam to earn your certificate")}
            className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 cursor-pointer hover:border-[#B4863A] active:scale-95 transition-all shadow-xs flex flex-col items-center justify-between gap-1.5 min-h-[94px] sm:min-h-[98px]"
          >
            <div className="w-7 h-7 rounded-full bg-[#F6F1E6] border border-[#E1D8C2] flex items-center justify-center text-[#8C6425] shrink-0">
              <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8.8 13.5L7 21l5-2.5L17 21l-1.8-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="font-serif font-semibold text-[15px] sm:text-[16px] text-[#132242] leading-none w-full text-center">
              Locked
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-[#7A7160] font-medium leading-tight text-center">Certificate</div>
          </div>
        </div>

        {/* Curriculum Preview */}
        {previewModules.length > 0 && (
          <div className="w-full shrink-0">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase">
                Curriculum preview
              </div>
              <button
                type="button"
                onClick={() => navigateTo("learn")}
                className="text-[10.5px] font-bold text-[#8C6425] hover:text-[#B4863A] transition-colors cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {previewModules.map((m) => {
                const mins = Math.round(m.lessons.reduce((a, l) => a + l.durationSeconds, 0) / 60);
                return (
                  <div
                    key={m.id}
                    onClick={() => guardEnrolment("Please enrol in the ABB programme to access course modules")}
                    className="w-full bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] p-2.5 sm:p-3 flex gap-3 items-center cursor-pointer hover:border-[#B4863A] active:scale-[0.99] transition-all shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-serif font-bold text-[12.5px] bg-[#EEE6D3] text-[#7A7160]">
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
                    <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160] shrink-0">
                      <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
                      <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Latest Update — notification preview */}
        {latestUnread && (
          <div className="w-full shrink-0">
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
        <div className="w-full shrink-0">
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-3 px-0.5">
            Programme stages
          </div>
          <div className="flex justify-between px-1 sm:px-2 w-full">
            <div className="text-center flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 shadow-xs bg-[#B4863A] text-[#2A1D07]">
                01
              </div>
              <div className="text-[10px] text-[#132242] font-bold">Learn</div>
            </div>

            <div className="text-center flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 shadow-xs bg-[#EEE6D3] text-[#7A7160]">
                02
              </div>
              <div className="text-[10px] text-[#7A7160] font-medium">Apply</div>
            </div>

            <div className="text-center flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 bg-[#EEE6D3] text-[#7A7160]">
                03
              </div>
              <div className="text-[10px] text-[#7A7160] font-medium">Qualify</div>
            </div>

            <div className="text-center flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto mb-1.5 bg-[#EEE6D3] text-[#7A7160]">
                04
              </div>
              <div className="text-[10px] text-[#7A7160] font-medium">Certified</div>
            </div>
          </div>
        </div>

        {/* Course facts strip */}
        <div className="w-full shrink-0 bg-[#FFFDF8] border border-[#E1D8C2] rounded-[16px] px-3 py-2.5 flex items-center justify-around shadow-xs">
          <div className="text-center">
            <div className="font-serif font-bold text-[14px] sm:text-[15px] text-[#132242] leading-none">
              {modules.length}
            </div>
            <div className="text-[9px] sm:text-[9.5px] text-[#7A7160] font-medium mt-1">Modules</div>
          </div>
          <div className="w-px h-7 bg-[#E1D8C2]" />
          <div className="text-center">
            <div className="font-serif font-bold text-[14px] sm:text-[15px] text-[#132242] leading-none">
              {totalLessons}
            </div>
            <div className="text-[9px] sm:text-[9.5px] text-[#7A7160] font-medium mt-1">Video Lessons</div>
          </div>
          <div className="w-px h-7 bg-[#E1D8C2]" />
          <div className="text-center">
            <div className="font-serif font-bold text-[14px] sm:text-[15px] text-[#132242] leading-none">
              ~{totalHours}h
            </div>
            <div className="text-[9px] sm:text-[9.5px] text-[#7A7160] font-medium mt-1">Content</div>
          </div>
          <div className="w-px h-7 bg-[#E1D8C2]" />
          <div className="text-center">
            <div className="font-serif font-bold text-[14px] sm:text-[15px] text-[#132242] leading-none">365</div>
            <div className="text-[9px] sm:text-[9.5px] text-[#7A7160] font-medium mt-1">Days Access</div>
          </div>
        </div>

        {/* Footer tagline */}
        <div className="pt-1 pb-1 text-center w-full shrink-0">
          <div className="text-[9.5px] sm:text-[10px] text-[#7A7160]/70 font-medium tracking-wide">
            YBB India · Authorised Business Broker Programme
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
};
