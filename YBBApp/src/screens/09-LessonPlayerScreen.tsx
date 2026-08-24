import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { AssignmentView } from "../components/ui/AssignmentView";

export const LessonPlayerScreen: React.FC = () => {
  const { modules, selectedModule, selectedLesson, selectLesson, markLessonComplete, showToast, user, navigateTo, goBack, screenHistory } =
    useApp();

  const isEnrolled = Boolean(user?.isEnrolled);

  const isCurrentLessonLocked = Boolean(selectedLesson?.isLocked);
  const isCurrentLessonComplete = Boolean(selectedLesson?.isComplete);
  const threshold = selectedLesson?.completionWatchPercent ?? 90;

  const [activeTab, setActiveTab] = useState<"lessons" | "workbook" | "assignment">("lessons");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(selectedLesson?.durationSeconds || 380);
  const [watchPercent, setWatchPercent] = useState<number>(
    isCurrentLessonComplete ? 100 : (selectedLesson?.watchPercent ?? 0)
  );
  const [hasVideoError, setHasVideoError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [assignmentText, setAssignmentText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrubbing = useRef(false);
  const watchedRef = useRef<Set<number>>(new Set());

  // Safe single-click back navigation handler
  const handleBackNavigation = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    // Find the last non-lesson-player screen in history or default to "learn"
    const lastValidScreen = [...screenHistory].reverse().find((s) => s !== "lesson-player");
    if (lastValidScreen) {
      navigateTo(lastValidScreen);
    } else {
      navigateTo("learn");
    }
  };

  // Reset player and watch tracker when lesson changes
  useEffect(() => {
    watchedRef.current = new Set();
    setWatchPercent(selectedLesson.isComplete ? 100 : (selectedLesson.watchPercent ?? 0));
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setHasVideoError(false);
      setIsBuffering(false);
      videoRef.current.load();
    }
    setControlsVisible(true);
    scheduleHide();
  }, [selectedLesson.id, selectedLesson.isComplete, selectedLesson.watchPercent]);

  // Auto-hide controls after 3s when playing
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 3000);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    showControls();
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => { setIsPlaying(true); setHasVideoError(false); })
        .catch(() => { setIsPlaying(false); });
    }
  };

  const handleSkip = (secs: number) => {
    if (!videoRef.current) return;
    showControls();
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + secs));
    videoRef.current.currentTime = newTime;
    setCurrentTime(Math.floor(newTime));
  };

  const handleVideoTap = () => {
    if (controlsVisible) {
      handlePlayPause();
    } else {
      showControls();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing.current) {
      const cur = Math.floor(videoRef.current.currentTime);
      setCurrentTime(cur);
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && dur > 0) {
        const floorDur = Math.floor(dur);
        setDuration(floorDur);

        if (!selectedLesson.isComplete) {
          watchedRef.current.add(cur);
          const watchedSecs = watchedRef.current.size;
          const calculatedPercent = Math.min(100, Math.round((watchedSecs / floorDur) * 100));

          setWatchPercent((prev) => Math.max(prev, calculatedPercent));

          if (calculatedPercent >= threshold) {
            markLessonComplete(selectedLesson.id, false);
          }
        }
      }
    }
  };

  // --- Touch scrubbing for mobile ---
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const scrubToPosition = (clientX: number) => {
    if (!videoRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = Math.floor(pct * duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isScrubbing.current = true;
    showControls();
    scrubToPosition(e.touches[0].clientX);
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    scrubToPosition(e.touches[0].clientX);
  };

  const handleProgressTouchEnd = () => {
    isScrubbing.current = false;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    scrubToPosition(e.clientX);
    showControls();
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
    }
  };

  const handleMarkComplete = () => markLessonComplete(selectedLesson.id, true);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      showToast("File size exceeds 25 MB limit", "error");
      return;
    }
    setUploadedFile(file);
    showToast(`File selected: ${file.name}`, "info");
  };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentText.trim() && !uploadedFile) {
      showToast("Please write a response or upload a file before submitting", "error");
      return;
    }
    setAssignmentSubmitted(true);
    showToast("Assignment submitted for faculty review!", "success");
  };

  // Flatten all lessons across all modules to calculate overall sequence
  const allLessonsFlat = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleNumber: m.number, moduleTitle: m.title }))
  );
  const currentFlatIndex = allLessonsFlat.findIndex((l) => l.id === selectedLesson.id);
  const previousLesson = currentFlatIndex > 0 ? allLessonsFlat[currentFlatIndex - 1] : null;
  const nextLesson =
    currentFlatIndex >= 0 && currentFlatIndex < allLessonsFlat.length - 1
      ? allLessonsFlat[currentFlatIndex + 1]
      : null;

  const videoSrc =
    selectedLesson.videoUrl ||
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  if (!isEnrolled) {
    return (
      <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
        <TopBar
          title={`Module ${selectedModule.number < 10 ? `0${selectedModule.number}` : selectedModule.number} · ${selectedModule.title}`}
          showBack={true}
          onBack={handleBackNavigation}
        />
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#EEE6D3] text-[#7A7160] flex items-center justify-center mb-4 shadow-xs">
            <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
              <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
              <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
          <h2 className="font-serif font-bold text-[20px] text-[#132242] mb-2">
            Course Enrolment Required
          </h2>
          <p className="text-[13px] text-[#7A7160] max-w-xs mb-6 leading-relaxed">
            You must be enrolled in the ABB Certification Programme to stream masterclass video lessons, access practical workbooks, and submit assignments.
          </p>
          <button
            type="button"
            onClick={() => navigateTo("enrol")}
            className="btn btn-primary w-full max-w-xs shadow-md text-[14px] py-3"
          >
            Enrol in Programme
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
      <TopBar
        title={`Module ${selectedModule.number < 10 ? `0${selectedModule.number}` : selectedModule.number} · ${selectedModule.title}`}
        showBack={true}
        onBack={handleBackNavigation}
      />

      {/* Video Player or Locked Screen */}
      {isCurrentLessonLocked ? (
        <div className="bg-[#0E1730] aspect-video relative flex flex-col items-center justify-center p-6 text-center select-none shrink-0 border-b border-[#1F3363]">
          <div className="w-12 h-12 rounded-full bg-white/10 text-[#E7CE9C] flex items-center justify-center mb-3 shadow-inner">
            <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
              <rect height="11" rx="2" stroke="currentColor" strokeWidth="2" width="16" x="4" y="10" />
              <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="font-serif font-bold text-[16px] text-[#F3EEE1] mb-1">
            Lesson Locked
          </div>
          <p className="text-[12px] text-[#B9C0D6] max-w-xs leading-relaxed">
            Complete the previous lesson to unlock this one.
          </p>
          {previousLesson && !previousLesson.isLocked && (
            <button
              type="button"
              onClick={() => selectLesson(previousLesson.moduleId, previousLesson.id)}
              className="mt-3.5 px-3.5 py-1.5 rounded-lg bg-[#E7CE9C] text-[#2A1D07] text-[12px] font-bold active:scale-95 transition-transform"
            >
              Go to Previous Lesson
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#0E1730] aspect-video relative flex items-center justify-center select-none overflow-hidden shrink-0">
          <video
            ref={videoRef}
            src={videoSrc}
            preload="metadata"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onPlaying={() => { setIsBuffering(false); setIsPlaying(true); scheduleHide(); }}
            onPause={() => { setIsPlaying(false); setControlsVisible(true); }}
            onEnded={() => {
              setIsPlaying(false);
              setControlsVisible(true);
              setWatchPercent(100);
              if (!selectedLesson.isComplete) {
                markLessonComplete(selectedLesson.id, false);
              }
            }}
            onError={() => { setHasVideoError(true); setIsBuffering(false); }}
            onLoadedMetadata={() => {
              if (videoRef.current?.duration && !isNaN(videoRef.current.duration)) {
                setDuration(Math.floor(videoRef.current.duration));
              }
            }}
            className="w-full h-full object-cover"
          />

          {/* Error overlay */}
          {hasVideoError && (
            <div className="absolute inset-0 bg-[#0E1730]/95 flex flex-col items-center justify-center p-4 text-center z-10">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-[13px] text-[#F3EEE1] font-semibold mb-1">Video unavailable</div>
              <p className="text-[11px] text-[#B9C0D6]">Check your internet connection and try again.</p>
            </div>
          )}

          {/* Buffering spinner */}
          {isBuffering && !hasVideoError && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-10 h-10 border-2 border-white/30 border-t-[#E7CE9C] rounded-full animate-spin" />
            </div>
          )}

          {/* Tap capture area (whole video) */}
          <div
            className="absolute inset-0 z-25"
            onClick={handleVideoTap}
          />

          {/* Controls overlay — shows/hides on tap */}
          <div
            className={`absolute inset-0 z-30 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
          >
            {/* Top gradient */}
            <div className="h-12 bg-gradient-to-b from-black/60 to-transparent" />

            {/* Center controls */}
            <div className="flex items-center justify-center gap-8 pointer-events-auto">
              {/* Skip back 10s */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
                className="w-10 h-10 flex flex-col items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Skip back 10 seconds"
              >
                <svg fill="none" height="26" viewBox="0 0 24 24" width="26">
                  <path d="M12 5V2L7 7l5 5V8c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
                </svg>
                <span className="text-[8px] font-bold text-white/80 -mt-1">10</span>
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center active:scale-90 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg fill="#E7CE9C" height="22" viewBox="0 0 24 24" width="22">
                    <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                    <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                  </svg>
                ) : (
                  <svg fill="#E7CE9C" height="24" viewBox="0 0 24 24" width="24" style={{ marginLeft: 3 }}>
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Skip forward 10s */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSkip(10); }}
                className="w-10 h-10 flex flex-col items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Skip forward 10 seconds"
              >
                <svg fill="none" height="26" viewBox="0 0 24 24" width="26">
                  <path d="M12 5V2l5 5-5 5V8c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor"/>
                </svg>
                <span className="text-[8px] font-bold text-white/80 -mt-1">10</span>
              </button>
            </div>

            {/* Bottom bar: time + scrubber + fullscreen */}
            <div className="pointer-events-auto px-3.5 pb-2.5 pt-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              {/* Time + fullscreen */}
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-[10px] text-[#EFE6D2]">{formatTime(currentTime)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#B9C0D6]">{formatTime(duration)}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                    aria-label="Fullscreen"
                    className="text-white/80 active:scale-90 transition-transform"
                  >
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* Touch-enabled progress scrubber */}
              <div
                ref={progressBarRef}
                className="flex-1 h-[6px] bg-white/25 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
                onTouchStart={(e) => { e.stopPropagation(); handleProgressTouchStart(e); }}
                onTouchMove={(e) => { e.stopPropagation(); handleProgressTouchMove(e); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleProgressTouchEnd(); }}
              >
                <div
                  className="h-full bg-[#E7CE9C] rounded-full transition-none"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watch 90% to complete Progress Card */}
      <div className="px-5 pt-3.5 pb-1 shrink-0 bg-[#F6F1E6]">
        <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[#132242]">
              {isCurrentLessonComplete ? "Lesson complete" : `Watch ${threshold}% to complete`}
            </span>
            <span className="text-[#7A7160] font-mono text-[12px] font-medium">
              {isCurrentLessonComplete ? 100 : watchPercent}%
            </span>
          </div>

          <div className="mt-2.5 h-2 w-full bg-[#EEE6D3] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCurrentLessonComplete ? "bg-[#1E4B3E]" : "bg-[#B4863A]"
              }`}
              style={{ width: `${isCurrentLessonComplete ? 100 : watchPercent}%` }}
            />
          </div>

          {isCurrentLessonComplete ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-[#1E4B3E] font-medium">
              <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="shrink-0 text-[#1E4B3E]">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Recorded against your programme progress.</span>
            </p>
          ) : !selectedLesson.videoUrl ? (
            <button
              type="button"
              onClick={handleMarkComplete}
              className="mt-3 px-3 py-1.5 rounded-lg bg-[#B4863A] text-[#2A1D07] text-[11.5px] font-bold active:scale-95 transition-transform"
            >
              Mark as complete
            </button>
          ) : null}
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex gap-6 px-5 pt-3.5 pb-2 border-b border-[#E1D8C2] shrink-0 bg-[#F6F1E6]">
        <button
          type="button"
          onClick={() => setActiveTab("lessons")}
          className={`text-[12.5px] font-bold pb-2 transition-colors relative ${
            activeTab === "lessons"
              ? "text-[#132242] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#8C6425]"
              : "text-[#7A7160] hover:text-[#132242]"
          }`}
        >
          Lessons ({selectedModule.lessons.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("workbook")}
          className={`text-[12.5px] font-bold pb-2 transition-colors relative ${
            activeTab === "workbook"
              ? "text-[#132242] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#8C6425]"
              : "text-[#7A7160] hover:text-[#132242]"
          }`}
        >
          Workbook
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("assignment")}
          className={`text-[12.5px] font-bold pb-2 transition-colors relative ${
            activeTab === "assignment"
              ? "text-[#132242] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#8C6425]"
              : "text-[#7A7160] hover:text-[#132242]"
          }`}
        >
          Assignment
        </button>
      </div>

      {/* Subtab Content (Scrollable in middle) */}
      <div className="flex-1 overflow-y-auto px-5 py-3.5 flex flex-col gap-2">
        {activeTab === "lessons" && (
          <div className="flex flex-col gap-2">
            {selectedModule.lessons.map((les) => {
              const isSelected = les.id === selectedLesson.id;
              const isComplete = les.isComplete;
              const isLocked = les.isLocked;

              return (
                <div
                  key={les.id}
                  onClick={() => {
                    if (!isLocked) {
                      selectLesson(selectedModule.id, les.id);
                    } else {
                      showToast("Complete previous lessons to unlock this lesson", "info");
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#EEE6D3] shadow-xs"
                      : "bg-[#FFFDF8] border border-[#E1D8C2] hover:bg-black/[0.02]"
                  } ${isLocked ? "opacity-60" : ""}`}
                >
                  {isComplete ? (
                    <div className="w-5 h-5 rounded-full bg-[#1E4B3E] text-white flex items-center justify-center shrink-0">
                      <svg fill="none" height="11" viewBox="0 0 24 24" width="11">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[#B4863A] text-[#2A1D07] flex items-center justify-center shrink-0">
                      <svg fill="currentColor" height="9" viewBox="0 0 24 24" width="9" className="ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : isLocked ? (
                    <div className="w-5 h-5 rounded-full bg-[#EEE6D3] flex items-center justify-center shrink-0 text-[#7A7160]">
                      <svg fill="none" height="10" viewBox="0 0 24 24" width="10">
                        <rect height="10" rx="2" stroke="currentColor" strokeWidth="2" width="14" x="5" y="10" />
                        <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#E1D8C2] shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[12.5px] truncate ${
                        isSelected ? "font-bold text-[#132242]" : "text-[#132242]"
                      }`}
                    >
                      {les.title}
                    </div>
                    {les.summary && (
                      <div className="text-[10.5px] text-[#7A7160] truncate mt-0.5">
                        {les.summary}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "workbook" && (
          <div className="flex flex-col gap-3 py-1">
            <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl p-4 shadow-xs">
              <h4 className="font-serif font-semibold text-[15px] text-[#132242] mb-1.5">
                Module Summary Notes
              </h4>
              <p className="text-[12.5px] text-[#7A7160] leading-relaxed">
                {selectedModule.workbookSummary ||
                  "Comprehensive study materials and frameworks for understanding business broking principles and methodologies."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => showToast("Workbook PDF downloaded to device storage", "success")}
              className="btn btn-ghost text-[13px] flex items-center justify-center gap-2"
            >
              <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Download Module Workbook (PDF)</span>
            </button>
          </div>
        )}

        {activeTab === "assignment" && (
          <div className="py-1 flex flex-col gap-3">
            {!isCurrentLessonComplete ? (
              <div className="bg-[#FFFDF8] border border-dashed border-[#E1D8C2] rounded-2xl p-6 text-center shadow-xs">
                <div className="w-11 h-11 rounded-full bg-[#EEE6D3] text-[#7A7160] flex items-center justify-center mx-auto mb-3">
                  <svg fill="none" height="20" viewBox="0 0 24 24" width="20">
                    <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
                    <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="font-serif font-bold text-[15px] text-[#132242] mb-1">
                  Assignment Locked
                </div>
                <p className="text-[12px] text-[#7A7160] leading-relaxed max-w-xs mx-auto mb-4">
                  Complete this lesson first to unlock and submit its practical evaluation assignment.
                </p>
                {!isCurrentLessonLocked && (
                  <button
                    type="button"
                    onClick={handleMarkComplete}
                    className="btn btn-primary text-[12px] py-2 px-4 shadow-xs"
                  >
                    Mark Lesson as Complete
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#132242] text-[#E7CE9C] flex items-center justify-center shrink-0">
                      <svg fill="none" height="15" viewBox="0 0 24 24" width="15" className="text-[#E7CE9C]">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-[#132242] truncate">
                        Module {selectedModule.number}: {selectedModule.title}
                      </div>
                      <div className="text-[10.5px] text-[#7A7160] truncate">
                        Submit assignment &amp; track faculty grading
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo("assignment")}
                    className="px-2.5 py-1.5 rounded-lg bg-[#132242] text-[#F3EEE1] text-[11px] font-bold hover:bg-[#1C2E56] transition-colors shrink-0 cursor-pointer"
                  >
                    Full Screen →
                  </button>
                </div>

                <AssignmentView
                  modules={modules}
                  selectedModuleId={selectedModule.id}
                  selectedLessonId={selectedLesson?.id}
                  showToast={showToast}
                  singleModuleOnly={true}
                  onSelectModule={(modId) => {
                    const mod = modules.find((m) => m.id === modId);
                    if (mod && mod.lessons[0]) {
                      selectLesson(mod.id, mod.lessons[0].id);
                    }
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Docked Action Button at Bottom */}
      <div className="px-5 py-3.5 pb-6 border-t border-[#E1D8C2] bg-[#F6F1E6] shrink-0 flex items-center gap-2.5">
        {previousLesson && (
          <button
            type="button"
            onClick={() => selectLesson(previousLesson.moduleId, previousLesson.id)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E1D8C2] bg-[#FFFDF8] text-[#132242] text-[12.5px] font-semibold hover:border-[#B4863A] active:scale-95 transition-all shrink-0 flex items-center gap-1"
          >
            <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Previous</span>
          </button>
        )}

        {isCurrentLessonLocked ? (
          <button
            type="button"
            disabled
            className="flex-1 py-2.5 rounded-xl bg-[#EEE6D3] text-[#7A7160] text-[13px] font-bold cursor-not-allowed opacity-75 text-center flex items-center justify-center gap-2"
          >
            <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
              <rect height="10" rx="2" stroke="currentColor" strokeWidth="2" width="14" x="5" y="10" />
              <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Lesson Locked</span>
          </button>
        ) : !isCurrentLessonComplete ? (
          <button
            type="button"
            onClick={handleMarkComplete}
            className="btn btn-brass flex-1 text-[13.5px] py-2.5"
          >
            Mark complete &amp; continue
          </button>
        ) : nextLesson && !nextLesson.isLocked ? (
          <button
            type="button"
            onClick={() => selectLesson(nextLesson.moduleId, nextLesson.id)}
            className="btn btn-brass flex-1 text-[13.5px] py-2.5 flex items-center justify-center gap-1.5"
          >
            <span>Next Lesson</span>
            <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigateTo("learn")}
            className="btn btn-primary flex-1 text-[13.5px] py-2.5"
          >
            Curriculum Overview
          </button>
        )}
      </div>
    </div>
  );
};
