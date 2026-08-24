import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { AppNotification } from "../types/app.types";

export const NotificationScreen: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    navigateTo,
    selectLesson,
  } = useApp();

  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "important") return n.type === "assignment" || n.type === "exam";
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.actionScreen) {
      if (notif.actionScreen === "lesson-player") {
        selectLesson("mod-05", "les-05-03");
      } else {
        navigateTo(notif.actionScreen);
      }
    }
  };

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "assignment":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#1E4B3E]/15 text-[#1E4B3E] flex items-center justify-center shrink-0">
            <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case "lesson":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#B4863A]/15 text-[#8C6425] flex items-center justify-center shrink-0">
            <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
              <path
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        );
      case "exam":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#9A4230]/15 text-[#9A4230] flex items-center justify-center shrink-0">
            <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        );
      case "certificate":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#B4863A]/20 text-[#8C6425] flex items-center justify-center shrink-0">
            <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#132242]/10 text-[#132242] flex items-center justify-center shrink-0">
            <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
      <TopBar
        title="Notifications"
        showBack={true}
        rightElement={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-[12px] text-[#8C6425] font-semibold hover:underline"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      {/* Filter Tabs */}
      <div className="px-5 pt-3 pb-2 flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
            filter === "all"
              ? "bg-[#132242] text-[#F6F1E6] shadow-xs"
              : "bg-[#EEE6D3] text-[#7A7160] hover:text-[#132242]"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
            filter === "unread"
              ? "bg-[#132242] text-[#F6F1E6] shadow-xs"
              : "bg-[#EEE6D3] text-[#7A7160] hover:text-[#132242]"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#B4863A] text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFilter("important")}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
            filter === "important"
              ? "bg-[#132242] text-[#F6F1E6] shadow-xs"
              : "bg-[#EEE6D3] text-[#7A7160] hover:text-[#132242]"
          }`}
        >
          Important
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-full bg-[#EEE6D3] flex items-center justify-center text-[#7A7160] mb-3">
              <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
                <path
                  d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <div className="font-serif font-semibold text-[16px] text-[#132242]">
              No notifications
            </div>
            <p className="text-[12.5px] text-[#7A7160] mt-1">
              You are all caught up! Important course updates will appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-[16px] border transition-all cursor-pointer flex gap-3.5 items-start ${
                notif.isRead
                  ? "bg-[#FFFDF8] border-[#E1D8C2] opacity-80"
                  : "bg-[#FFFDF8] border-[#B4863A] shadow-xs"
              }`}
            >
              {getNotificationIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="text-[13.5px] font-bold text-[#132242] leading-tight">
                    {notif.title}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-[#7A7160]">
                      {notif.timestamp}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#B4863A]" />
                    )}
                  </div>
                </div>

                <p className="text-[12px] text-[#7A7160] leading-relaxed">
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Clear Action */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-[#E1D8C2] bg-[#F6F1E6] shrink-0 text-center">
          <button
            type="button"
            onClick={clearNotifications}
            className="text-[12.5px] text-[#7A7160] hover:text-[#9A4230] font-medium"
          >
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  );
};
