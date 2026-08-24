import React from "react";
import { TabName } from "../../types/app.types";
import { useApp } from "../../context/AppContext";

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs: { id: TabName; label: string; icon: React.ReactNode }[] = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M4 11l8-7 8 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M6 10v9h12v-9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
    {
      id: "learn",
      label: "Learn",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 001.5-1.5v-13z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    },
    {
      id: "verify",
      label: "Verify",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M12 3l7 3v6c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6l7-3z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5">
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M5 20c1.2-4 4.2-6 7-6s5.8 2 7 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-[62px] shrink-0 flex border-t border-[#E1D8C2] bg-[#FFFDF8] z-30 select-none safe-bottom">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-150 ${
              isActive ? "text-[#8C6425]" : "text-[#7A7160] hover:text-[#132242]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
