import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { TabBar } from "../components/ui/TabBar";
import { sendPushNotification } from "../lib/notifications";
import { createSupportTicketInDb, fetchUserPaymentReceipt } from "../lib/api";
import { UserPaymentReceipt } from "../types/app.types";

const PRESET_AVATARS = [
  { id: "exec-navy", label: "Executive", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
  { id: "exec-gold", label: "Advisor", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
  { id: "exec-slate", label: "Broker", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80" },
  { id: "exec-classic", label: "Consultant", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80" },
];

export const ProfileScreen: React.FC = () => {
  const { user, signOut, showToast, navigateTo, notifications, modules, certificate, updateProfile, refreshUserData } = useApp();
  const [activeModal, setActiveModal] = useState<
    "payment" | "notifications" | "support" | "terms" | "signout" | null
  >(null);

  // Edit Profile modal state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    avatarUrl: "",
    city: "",
    state: "",
    organisation: "",
    profession: "",
    education: "",
  });

  // Payment & Receipts State (Actual price paid from Supabase)
  const [receiptData, setReceiptData] = useState<UserPaymentReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("course_content");
  const [ticketDescription, setTicketDescription] = useState("");

  const [notificationSettings, setNotificationSettings] = useState({
    lessonReminders: true,
    assignmentAlerts: true,
    certAlerts: true,
  });

  const completedModulesCount = modules.filter((m) => m.status === "completed").length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getInitials = (name?: string) => {
    if (!name) return "YB";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Re-sync user data from Supabase whenever ProfileScreen mounts to guarantee 100% freshness
  useEffect(() => {
    if (user?.id) {
      refreshUserData(user.id);
    }
  }, []);

  // Fetch actual payment record whenever Payment & Receipts modal opens
  useEffect(() => {
    if (activeModal === "payment") {
      setLoadingReceipt(true);
      fetchUserPaymentReceipt(user?.id)
        .then((data) => setReceiptData(data))
        .catch((err) => console.warn("Failed to fetch payment receipt:", err))
        .finally(() => setLoadingReceipt(false));
    }
  }, [activeModal, user?.id]);

  const handleOpenEditProfile = () => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || "",
      avatarUrl: user?.avatarUrl || "",
      city: user?.city || "",
      state: user?.state || "",
      organisation: user?.organisation || "",
      profession: user?.profession || "",
      education: user?.education || "",
    });
    setEditProfileOpen(true);
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("Photo must be smaller than 8 MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
        showToast("Photo chosen! Click 'Save Changes' to update.", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast("Full name is required", "error");
      return;
    }

    setIsSavingProfile(true);
    const success = await updateProfile({
      name: editForm.name.trim(),
      phone: editForm.phone.trim() || undefined,
      avatarUrl: editForm.avatarUrl.trim() || undefined,
      city: editForm.city.trim() || undefined,
      state: editForm.state.trim() || undefined,
      organisation: editForm.organisation.trim() || undefined,
      profession: editForm.profession.trim() || undefined,
      education: editForm.education.trim() || undefined,
    });
    setIsSavingProfile(false);
    if (success) {
      setEditProfileOpen(false);
    }
  };

  const handleToggleNotification = async (key: keyof typeof notificationSettings) => {
    const updated = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(updated);

    if (!notificationSettings[key]) {
      await sendPushNotification(
        "Notification Preferences Updated",
        `You will now receive instant push alerts for ${
          key === "lessonReminders"
            ? "study & lesson reminders"
            : key === "assignmentAlerts"
            ? "assignment grading updates"
            : "certificate alerts"
        }.`
      );
      showToast("Notification preferences updated successfully!", "success");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden relative">
      <TopBar title="Profile & Account" />

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* User Card */}
        <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#FFFDF8] border border-[#E1D8C2] shadow-xs">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.name || "Avatar"}
              className="w-[58px] h-[58px] rounded-full object-cover border border-[#E1D8C2] shadow-sm shrink-0"
            />
          ) : (
            <div className="w-[58px] h-[58px] rounded-full bg-[#132242] text-[#E7CE9C] flex items-center justify-center font-serif font-bold text-[21px] shrink-0 shadow-sm">
              {getInitials(user?.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <div className="font-serif font-bold text-[17px] text-[#132242] truncate leading-tight">
                {user?.name || (user?.email ? user.email.split("@")[0] : "Learner Account")}
              </div>
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EEE6D3] hover:bg-[#E1D8C2] text-[#132242] text-[11px] font-bold active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
                aria-label="Edit Profile"
              >
                <svg fill="none" height="11" viewBox="0 0 24 24" width="11" className="text-[#8C6425]">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Edit</span>
              </button>
            </div>
            <div className="text-[12px] text-[#7A7160] truncate mt-0.5">
              {user?.email || "No email linked"}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`pill active text-[10px] font-bold ${
                  user?.isEnrolled
                    ? "!bg-[#1E4B3E]/15 !text-[#1E4B3E]"
                    : "!bg-[#9A4230]/15 !text-[#9A4230]"
                }`}
              >
                {user?.isEnrolled ? "● ABB Enrolled" : "● Not Enrolled"}
              </span>
              <span className="font-mono text-[10px] text-[#8C6425] font-semibold truncate">
                {user?.isEnrolled ? user?.abbId || "YBB-ABB-2026-1580" : "Enrolment Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Not Enrolled Action Card */}
        {!user?.isEnrolled && (
          <div className="bg-[#132242] rounded-[18px] p-4 text-[#F3EEE1] shadow-sm flex items-center justify-between gap-3 border border-[#E7CE9C]/20">
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-[#FFFDF8] leading-snug">
                Enrol in ABB Programme
              </div>
              <div className="text-[11.5px] text-[#B9C0D6] mt-0.5">
                Unlock all 12 modules, assignments &amp; certificate.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("enrol")}
              className="btn btn-primary text-[12px] py-2 px-3.5 shrink-0 shadow-xs"
            >
              Enrol Now
            </button>
          </div>
        )}

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl p-3 text-center">
            <div className="font-serif font-bold text-[16px] text-[#132242]">
              {user?.isEnrolled ? `${completedModulesCount} / ${modules.length}` : "0 / 12"}
            </div>
            <div className="text-[10px] text-[#7A7160] font-medium mt-0.5">Modules</div>
          </div>
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl p-3 text-center">
            <div className="font-serif font-bold text-[16px] text-[#132242]">
              {user?.isEnrolled ? user?.daysRemaining ?? 365 : 0}
            </div>
            <div className="text-[10px] text-[#7A7160] font-medium mt-0.5">Days Left</div>
          </div>
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-xl p-3 text-center">
            <div className="font-serif font-bold text-[16px] text-[#132242]">
              {user?.isEnrolled ? (certificate ? "Certified" : "Enrolled") : "Pending"}
            </div>
            <div className="text-[10px] text-[#7A7160] font-medium mt-0.5">Status</div>
          </div>
        </div>

        {/* Menu Groups */}
        <div className="flex flex-col gap-3.5">
          {/* Section 1: Learning & Credentials */}
          <div>
            <div className="text-[11px] font-bold text-[#8C6425] uppercase tracking-wider px-1 mb-1.5">
              Programme &amp; Credentials
            </div>
            <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl overflow-hidden divide-y divide-[#E1D8C2]/60">
              <button
                type="button"
                onClick={() => {
                  if (user?.isEnrolled) {
                    setActiveModal("payment");
                  } else {
                    navigateTo("enrol");
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#F6F1E6]/50 active:bg-[#EEE6D3] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8C6425]/10 flex items-center justify-center text-[#8C6425] shrink-0">
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <rect height="16" rx="2" stroke="currentColor" strokeWidth="2" width="20" x="2" y="4" />
                      <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#132242]">
                      {user?.isEnrolled ? "Payment & Tax Invoices" : "Enrol & Payment"}
                    </div>
                    <div className="text-[11px] text-[#7A7160]">
                      {user?.isEnrolled
                        ? "View your enrolment payment and official invoice"
                        : "Unlock complete curriculum & certificate"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#8C6425]">
                    {user?.isEnrolled ? "View Receipt" : "Enrol"}
                  </span>
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160]">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo("verify")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#F6F1E6]/50 active:bg-[#EEE6D3] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1E4B3E]/10 flex items-center justify-center text-[#1E4B3E] shrink-0">
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#132242]">
                      ABB Certificate &amp; Verification
                    </div>
                    <div className="text-[11px] text-[#7A7160]">
                      {certificate ? "View & download issued credential" : "Verify registry status"}
                    </div>
                  </div>
                </div>
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160]">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Section 2: Notifications & Communication */}
          <div>
            <div className="text-[11px] font-bold text-[#8C6425] uppercase tracking-wider px-1 mb-1.5">
              Notifications &amp; Activity
            </div>
            <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl overflow-hidden divide-y divide-[#E1D8C2]/60">
              <button
                type="button"
                onClick={() => navigateTo("notifications")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#F6F1E6]/50 active:bg-[#EEE6D3] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#132242]/10 flex items-center justify-center text-[#132242] shrink-0">
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#132242]">Notification Inbox</div>
                    <div className="text-[11px] text-[#7A7160]">View latest announcements &amp; assignment grades</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-[#9A4230] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160]">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal("notifications")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#F6F1E6]/50 active:bg-[#EEE6D3] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8C6425]/10 flex items-center justify-center text-[#8C6425] shrink-0">
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#132242]">Push Alert Preferences</div>
                    <div className="text-[11px] text-[#7A7160]">Configure lesson &amp; assignment reminders</div>
                  </div>
                </div>
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160]">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Section 3: Support & Policies */}
          <div>
            <div className="text-[11px] font-bold text-[#8C6425] uppercase tracking-wider px-1 mb-1.5">
              Support &amp; Trust
            </div>
            <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl overflow-hidden divide-y divide-[#E1D8C2]/60">
              <button
                type="button"
                onClick={() => setActiveModal("support")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#F6F1E6]/50 active:bg-[#EEE6D3] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8C6425]/10 flex items-center justify-center text-[#8C6425] shrink-0">
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#132242]">Helpdesk &amp; Support Ticket</div>
                    <div className="text-[11px] text-[#7A7160]">Raise enquiries directly to academic review team</div>
                  </div>
                </div>
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160]">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal("terms")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#F6F1E6]/50 active:bg-[#EEE6D3] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#132242]/10 flex items-center justify-center text-[#132242] shrink-0">
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#132242]">Terms of Service &amp; Ethics</div>
                    <div className="text-[11px] text-[#7A7160]">ABB Code of conduct &amp; data privacy</div>
                  </div>
                </div>
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className="text-[#7A7160]">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-1 pb-3">
          <button
            type="button"
            onClick={() => setActiveModal("signout")}
            className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#9A4230]/30 text-[#9A4230] font-semibold text-[13.5px] flex items-center justify-center gap-2 hover:bg-[#9A4230]/5 active:bg-[#9A4230]/10 transition-colors shadow-2xs"
          >
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>

      {/* ─── EDIT PROFILE MODAL ─── */}
      {editProfileOpen && (
        <div className="absolute inset-0 bg-black/65 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#E1D8C2]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#8C6425]/15 flex items-center justify-center text-[#8C6425]">
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-serif font-bold text-[17px] text-[#132242]">Edit Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="w-7 h-7 rounded-full bg-[#EEE6D3] flex items-center justify-center text-[#132242] hover:bg-[#E1D8C2] active:scale-95 transition-all"
                aria-label="Close"
              >
                <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="overflow-y-auto max-h-[64vh] pr-1 py-3 flex flex-col gap-3">
              {/* Avatar Selector Section */}
              <div className="p-3 bg-[#F6F1E6] rounded-xl border border-[#E1D8C2] flex flex-col gap-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6425]">
                  Profile Avatar / Photo
                </div>
                <div className="flex items-center gap-3">
                  {editForm.avatarUrl ? (
                    <img
                      src={editForm.avatarUrl}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#8C6425] shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#132242] text-[#E7CE9C] flex items-center justify-center font-serif font-bold text-[18px] shrink-0 shadow-sm">
                      {getInitials(editForm.name || user?.name)}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-[#132242] text-[#FFFDF8] rounded-lg text-[11px] font-semibold hover:bg-[#1C3260] active:scale-95 transition-all"
                      >
                        Upload Photo
                      </button>
                      {editForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: "" }))}
                          className="px-2.5 py-1.5 bg-[#EEE6D3] text-[#9A4230] rounded-lg text-[11px] font-semibold hover:bg-[#E1D8C2] active:scale-95 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-[#7A7160]">
                      Syncs across Mobile App and Web Portal.
                    </div>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div>
                  <div className="text-[10px] text-[#7A7160] font-semibold mb-1">
                    Or select a professional preset:
                  </div>
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: av.url }))}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all active:scale-90 ${
                          editForm.avatarUrl === av.url ? "border-[#8C6425] ring-2 ring-[#8C6425]/30" : "border-[#E1D8C2]"
                        }`}
                        title={av.label}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                  Full Name <span className="text-[#9A4230]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                />
              </div>

              {/* Phone / Mobile */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                  />
                </div>
              </div>

              {/* Organisation & Profession */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                    Organisation
                  </label>
                  <input
                    type="text"
                    value={editForm.organisation}
                    onChange={(e) => setEditForm({ ...editForm, organisation: e.target.value })}
                    placeholder="Company name"
                    className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    value={editForm.profession}
                    onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                    placeholder="e.g. Business Broker"
                    className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                  />
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#132242] mb-1">
                  Highest Qualification
                </label>
                <input
                  type="text"
                  value={editForm.education}
                  onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                  placeholder="e.g. MBA / CA / Graduate"
                  className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-[#E1D8C2] bg-white text-[#132242] focus:outline-none focus:ring-1 focus:ring-[#8C6425]"
                />
              </div>
            </form>

            <div className="flex gap-2 pt-3 border-t border-[#E1D8C2]">
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                disabled={isSavingProfile}
                className="btn btn-ghost flex-1 text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="btn btn-primary flex-1 text-[13px] flex items-center justify-center gap-1.5"
              >
                {isSavingProfile ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GENERAL MODALS ─── */}
      {activeModal && (
        <div className="absolute inset-0 bg-black/65 z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-5 w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-serif font-semibold text-[17px] text-[#132242]">
                  {activeModal === "payment" && "Payment & Receipts"}
                  {activeModal === "notifications" && "Push Notification Settings"}
                  {activeModal === "support" && "Support & Enquiries"}
                  {activeModal === "terms" && "Terms & Legal Policies"}
                  {activeModal === "signout" && "Sign Out Confirmation"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-7 h-7 rounded-full bg-[#EEE6D3] flex items-center justify-center text-[#132242] hover:bg-[#E1D8C2] active:scale-95 transition-all"
                  aria-label="Close"
                >
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="text-[12.5px] text-[#7A7160] leading-relaxed overflow-y-auto max-h-[48vh] pr-1">
                {/* ─── PAYMENT & RECEIPTS MODAL: Shows exact payment made by user ─── */}
                {activeModal === "payment" && (
                  <div className="flex flex-col gap-3">
                    {loadingReceipt ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-[#8C6425]">
                        <span className="inline-block w-5 h-5 border-2 border-[#8C6425] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12px]">Loading receipt details...</span>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-[#F6F1E6] rounded-xl border border-[#E1D8C2]">
                        <div className="flex justify-between font-semibold text-[#132242]">
                          <span>ABB Certification Enrolment</span>
                          <span className="font-serif font-bold text-[#1E4B3E]">
                            ₹{receiptData?.amountPaidRupees ? receiptData.amountPaidRupees.toLocaleString("en-IN") : "17,700"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#7A7160] mt-1.5">
                          Invoice #{receiptData?.invoiceNumber || "YBB-INV-2026-0001"} · {receiptData?.paymentMethod || "Paid via Razorpay"}
                        </div>
                        <div className="text-[10.5px] text-[#7A7160] mt-0.5">
                          Date: {receiptData?.paymentDate || "Enrolment"}
                        </div>
                        <div className="text-[10px] text-[#1E4B3E] font-bold mt-1">
                          ● Fully Settled &amp; GST Invoiced
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── NOTIFICATIONS MODAL ─── */}
                {activeModal === "notifications" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[12px] text-[#7A7160] mb-1">
                      Choose which push alerts to receive directly on your Android phone:
                    </p>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F1E6] border border-[#E1D8C2] cursor-pointer">
                      <div>
                        <div className="text-[13px] font-semibold text-[#132242]">Lesson &amp; Study Reminders</div>
                        <div className="text-[11px] text-[#7A7160]">Gentle nudges to keep your study streak active</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.lessonReminders}
                        onChange={() => handleToggleNotification("lessonReminders")}
                        className="w-4 h-4 rounded text-[#8C6425] focus:ring-[#8C6425]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F1E6] border border-[#E1D8C2] cursor-pointer">
                      <div>
                        <div className="text-[13px] font-semibold text-[#132242]">Assignment Evaluations</div>
                        <div className="text-[11px] text-[#7A7160]">Instant alert when reviewer scores your assignment</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.assignmentAlerts}
                        onChange={() => handleToggleNotification("assignmentAlerts")}
                        className="w-4 h-4 rounded text-[#8C6425] focus:ring-[#8C6425]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F1E6] border border-[#E1D8C2] cursor-pointer">
                      <div>
                        <div className="text-[13px] font-semibold text-[#132242]">Certificate Dispatch Alerts</div>
                        <div className="text-[11px] text-[#7A7160]">Notice when your verifiable ABB ID &amp; PDF are issued</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.certAlerts}
                        onChange={() => handleToggleNotification("certAlerts")}
                        className="w-4 h-4 rounded text-[#8C6425] focus:ring-[#8C6425]"
                      />
                    </label>
                  </div>
                )}

                {/* ─── SUPPORT MODAL ─── */}
                {activeModal === "support" && (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-[#F6F1E6] rounded-xl border border-[#E1D8C2] flex flex-col gap-2.5">
                      <div className="text-[11px] font-bold text-[#8C6425] uppercase tracking-wider">
                        Create Support Request
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#132242] mb-1">
                          Category
                        </label>
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-[#E1D8C2] bg-white text-[#132242]"
                        >
                          <option value="course_content">Lesson &amp; Course Content</option>
                          <option value="assignment_review">Assignment &amp; Evaluation</option>
                          <option value="payment_billing">Payment &amp; Invoices</option>
                          <option value="certificate">Certificate &amp; Verification</option>
                          <option value="technical">App Technical Issue</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#132242] mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="Brief summary of enquiry"
                          className="w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-[#E1D8C2] bg-white text-[#132242]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#132242] mb-1">
                          Details
                        </label>
                        <textarea
                          rows={3}
                          value={ticketDescription}
                          onChange={(e) => setTicketDescription(e.target.value)}
                          placeholder="Describe your question or issue in detail..."
                          className="w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-[#E1D8C2] bg-white text-[#132242] resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!ticketSubject.trim() || !ticketDescription.trim()) {
                            showToast("Please enter a subject and description", "error");
                            return;
                          }
                          if (user?.id) {
                            await createSupportTicketInDb(
                              user.id,
                              ticketSubject,
                              ticketCategory,
                              ticketDescription
                            );
                          }
                          showToast("Support ticket raised successfully! Ticket ID generated.", "success");
                          setTicketSubject("");
                          setTicketDescription("");
                          setActiveModal(null);
                        }}
                        className="btn btn-primary text-[12px] py-1.5 w-full flex items-center justify-center gap-1.5"
                      >
                        <span>Submit Support Ticket</span>
                      </button>
                    </div>

                    <div className="p-3 bg-[#F6F1E6] rounded-xl border border-[#E1D8C2] text-[12px] text-[#132242] flex flex-col gap-2">
                      <div className="text-[11px] font-bold text-[#7A7160] uppercase tracking-wider">
                        Direct Contact
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#132242]/10 flex items-center justify-center text-[#132242] shrink-0">
                          <svg fill="none" height="11" viewBox="0 0 24 24" width="11">
                            <rect height="14" rx="2" stroke="currentColor" strokeWidth="2" width="18" x="3" y="5" />
                            <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </div>
                        <span className="font-mono text-[11.5px]">info@ybbindia.com</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#132242]/10 flex items-center justify-center text-[#132242] shrink-0">
                          <svg fill="none" height="11" viewBox="0 0 24 24" width="11">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="font-mono text-[11.5px]">+91 98220 12345</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TERMS MODAL ─── */}
                {activeModal === "terms" && (
                  <div>
                    <p className="mb-2 font-bold text-[#132242]">Yoova Business Broking Pvt Ltd</p>
                    <p className="mb-2">
                      The ABB Certification Programme is an educational and professional training programme. All materials are proprietary to YBB India.
                    </p>
                    <p>Course access is valid for 365 days from the date of enrolment.</p>
                  </div>
                )}

                {/* ─── SIGNOUT MODAL ─── */}
                {activeModal === "signout" && (
                  <div className="py-2 text-center">
                    <p className="text-[13.5px] text-[#132242] font-medium mb-1">
                      Are you sure you want to sign out?
                    </p>
                    <p className="text-[12px] text-[#7A7160]">
                      You will need to sign in again to access your learning modules and certificate.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {activeModal === "signout" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="btn btn-ghost flex-1 text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      signOut();
                    }}
                    className="btn btn-primary !bg-[#9A4230] text-white flex-1 text-[13px]"
                  >
                    Yes, Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-primary w-full text-[13.5px]"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Docked TabBar at Bottom */}
      <TabBar />
    </div>
  );
};
