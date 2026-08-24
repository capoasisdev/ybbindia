import React from "react";
import { useApp } from "../../context/AppContext";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  isDark?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack = false,
  onBack,
  rightElement,
  isDark = false,
}) => {
  const { goBack } = useApp();

  const handleBack = () => {
    if (onBack) onBack();
    else goBack();
  };

  return (
    <header
      className={`safe-top px-4 pb-3 flex items-center justify-between gap-3 border-b select-none shrink-0 transition-colors ${
        isDark
          ? "border-white/10 bg-[#0E1730] text-[#F3EEE1]"
          : "border-[#E8E0CE] bg-[#F6F1E6] text-[#132242]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${
              isDark
                ? "bg-white/10 hover:bg-white/15 text-[#FFFDF8]"
                : "bg-black/5 hover:bg-black/10 text-[#132242]"
            }`}
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {title && (
          <h1
            className={`font-serif font-bold text-[18px] tracking-tight truncate leading-none antialiased ${
              isDark ? "text-[#FFFDF8]" : "text-[#132242]"
            }`}
          >
            {title}
          </h1>
        )}
      </div>
      {rightElement && <div className="shrink-0 flex items-center">{rightElement}</div>}
    </header>
  );
};
