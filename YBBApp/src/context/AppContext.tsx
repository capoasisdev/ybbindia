import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ScreenName,
  TabName,
  UserProfile,
  Module,
  Lesson,
  CertificateRecord,
  AppNotification,
  ToastMessage,
} from "../types/app.types";
import { INITIAL_MODULES } from "../lib/courseData";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { triggerHaptic, setStatusBarTheme } from "../lib/native";
import { loadModulesFromSupabase, enrolUserInCourse, applySequentialLocking, updateUserProfileInDb } from "../lib/api";
import { initNotifications, sendPushNotification } from "../lib/notifications";
import { initAuth, fetchRealUserProfile } from "../lib/auth";
import { Preferences } from "@capacitor/preferences";
import { App as CapApp } from "@capacitor/app";

interface AppContextType {
  currentScreen: ScreenName;
  activeTab: TabName;
  screenHistory: ScreenName[];
  user: UserProfile | null;
  modules: Module[];
  selectedModule: Module;
  selectedLesson: Lesson;
  certificate: CertificateRecord | null;
  notifications: AppNotification[];
  toasts: ToastMessage[];
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  
  // Navigation
  navigateTo: (screen: ScreenName, withHaptic?: boolean) => void;
  goBack: () => void;
  setActiveTab: (tab: TabName) => void;
  completeOnboarding: () => Promise<void>;
  
  // Auth & Profile
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  refreshUserData: (userId?: string, email?: string, name?: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  enrolCourse: (
    courseId?: string,
    paymentDetails?: {
      gatewayPaymentId?: string;
      gatewayOrderId?: string;
      amountPaise?: number;
      method?: string;
      accessDurationDays?: number;
    }
  ) => Promise<boolean>;
  
  // Curriculum & Learning
  selectLesson: (moduleId: string, lessonId: string) => void;
  markLessonComplete: (lessonId: string, autoAdvance?: boolean) => Promise<void>;
  
  // Certificate
  setCertificate: (cert: CertificateRecord | null) => void;
  
  // Notifications
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "isRead">) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Toast
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("splash");
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);
  const [activeTab, setActiveTabState] = useState<TabName>("home");
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [selectedModule, setSelectedModule] = useState<Module>(INITIAL_MODULES[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(INITIAL_MODULES[0].lessons[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);

  // Real user and certificate (Starts as NULL for real authentication flow)
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-1",
      title: "Welcome to YBB",
      message: "Start your journey towards becoming an Authorised Business Broker.",
      timestamp: "Today",
      type: "system",
      isRead: false,
      actionScreen: "learn",
    },
  ]);

  // Load user data helper
  const loadUserData = async (userId: string, email?: string, name?: string) => {
    try {
      const { profile, certificate: cert } = await fetchRealUserProfile(userId, email, name);
      setUserState(profile);
      setCertificate(cert);

      const effectiveId = profile?.id || userId;
      const realMods = await loadModulesFromSupabase(effectiveId, profile?.isEnrolled ?? false);
      if (realMods && realMods.length > 0) {
        setModules(realMods);
        const firstIncompleteMod = realMods.find((m) => m.status === "in_progress") || realMods[0];
        setSelectedModule(firstIncompleteMod);
        const firstIncompleteLes = firstIncompleteMod.lessons.find((l) => !l.isComplete) || firstIncompleteMod.lessons[0];
        setSelectedLesson(firstIncompleteLes);
      }
    } catch (err) {
      console.warn("loadUserData error:", err);
    }
  };

  // Check auth session, onboarding status & load real Supabase data on startup
  useEffect(() => {
    async function initSession() {
      try {
        initAuth();
        initNotifications();

        // 1. Check onboarding preference
        const { value: onboardingVal } = await Preferences.get({ key: "ybb_onboarding_done" });
        const isDone = onboardingVal === "true";
        setHasSeenOnboarding(isDone);

        // 2. Check Supabase auth session
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUser = sessionData?.session?.user;

        if (activeUser) {
          await loadUserData(
            activeUser.id,
            activeUser.email || undefined,
            activeUser.user_metadata?.full_name || activeUser.user_metadata?.name || undefined
          );
        } else {
          // Unauthenticated: load initial curriculum from Supabase
          const publicMods = await loadModulesFromSupabase();
          if (publicMods && publicMods.length > 0) {
            setModules(publicMods);
            setSelectedModule(publicMods[0]);
            setSelectedLesson(publicMods[0].lessons[0]);
          }
        }

        // 3. Listen to Supabase auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) {
            await loadUserData(
              session.user.id,
              session.user.email || undefined,
              session.user.user_metadata?.full_name || session.user.user_metadata?.name || undefined
            );
          } else if (event === "SIGNED_OUT") {
            setUserState(null);
            setCertificate(null);
            navigateTo("sign-in");
          }
        });

        // 4. Live sync when returning to app from website or background
        const handleSyncOnResume = async () => {
          const { data: currentSession } = await supabase.auth.getSession();
          const u = currentSession?.session?.user;
          if (u) {
            await loadUserData(
              u.id,
              u.email || undefined,
              u.user_metadata?.full_name || u.user_metadata?.name || undefined
            );
          }
        };

        window.addEventListener("focus", handleSyncOnResume);
        try {
          CapApp.addListener("appStateChange", ({ isActive }) => {
            if (isActive) {
              handleSyncOnResume();
            }
          });
        } catch {}
      } catch (err) {
        console.error("Session check error", err);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  // Update Status bar theme whenever current screen changes
  useEffect(() => {
    const isDark = currentScreen === "splash";
    setStatusBarTheme(isDark);
  }, [currentScreen]);

  const completeOnboarding = async () => {
    try {
      await Preferences.set({ key: "ybb_onboarding_done", value: "true" });
      setHasSeenOnboarding(true);
    } catch {}
    navigateTo("sign-in");
  };

  const navigateTo = (screen: ScreenName, withHaptic = true) => {
    if (withHaptic) {
      triggerHaptic();
    }
    setScreenHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
    
    if (screen === "home") setActiveTabState("home");
    else if (screen === "learn") setActiveTabState("learn");
    else if (screen === "verify") setActiveTabState("verify");
    else if (screen === "profile") setActiveTabState("profile");
  };

  const goBack = () => {
    triggerHaptic();
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory((history) => history.slice(0, -1));
      setCurrentScreen(prev);
      if (["home", "learn", "verify", "profile"].includes(prev)) {
        setActiveTabState(prev as TabName);
      }
    } else {
      navigateTo("home");
    }
  };

  const setActiveTab = (tab: TabName) => {
    triggerHaptic();
    setActiveTabState(tab);
    setCurrentScreen(tab as ScreenName);
  };

  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
  };

  const refreshUserData = async (userId?: string, email?: string, name?: string) => {
    const targetId = userId || user?.id;
    const targetEmail = email || user?.email;
    const targetName = name || user?.name;
    if (targetId || targetEmail) {
      await loadUserData(targetId || "", targetEmail, targetName);
    }
  };

  const enrolCourse = async (
    courseId?: string,
    paymentDetails?: {
      gatewayPaymentId?: string;
      gatewayOrderId?: string;
      amountPaise?: number;
      method?: string;
      accessDurationDays?: number;
    }
  ): Promise<boolean> => {
    const effectiveUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;
    if (!effectiveUserId) {
      showToast("Please sign in to enrol in the course", "error");
      navigateTo("sign-in");
      return false;
    }

    try {
      setIsLoading(true);
      await enrolUserInCourse(effectiveUserId, courseId, paymentDetails);
      await loadUserData(effectiveUserId, user?.email, user?.name);
      showToast("🎉 Enrolment successful! All course modules are now unlocked.", "success");
      addNotification({
        title: "Enrolment Confirmed",
        message: "Welcome to the ABB Certification Programme! Your curriculum is now fully active.",
        type: "system",
        actionScreen: "learn",
      });
      sendPushNotification(
        "ABB Enrolment Active",
        "Your enrolment in the Authorised Business Broker programme has been confirmed."
      );
      return true;
    } catch (err) {
      console.error("Enrolment error:", err);
      showToast("Enrolment failed. Please try again.", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    triggerHaptic();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUserState(null);
    setCertificate(null);
    navigateTo("sign-in");
    showToast("Signed out successfully", "info");
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    triggerHaptic();
    try {
      await updateUserProfileInDb(user.id, {
        name: data.name || user.name,
        phone: data.phone !== undefined ? data.phone : user.phone,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
        city: data.city !== undefined ? data.city : user.city,
        state: data.state !== undefined ? data.state : user.state,
        organisation: data.organisation !== undefined ? data.organisation : user.organisation,
        profession: data.profession !== undefined ? data.profession : user.profession,
        education: data.education !== undefined ? data.education : user.education,
        certificateName: data.certificateName !== undefined ? data.certificateName : user.certificateName,
        billingAddress: data.billingAddress !== undefined ? data.billingAddress : user.billingAddress,
        billingCity: data.billingCity !== undefined ? data.billingCity : user.billingCity,
        billingState: data.billingState !== undefined ? data.billingState : user.billingState,
        billingPincode: data.billingPincode !== undefined ? data.billingPincode : user.billingPincode,
        gstNumber: data.gstNumber !== undefined ? data.gstNumber : user.gstNumber,
      });

      const updatedUser: UserProfile = {
        ...user,
        ...data,
      };
      setUserState(updatedUser);
      showToast("Profile updated successfully!", "success");
      return true;
    } catch (err: any) {
      console.error("Profile update error:", err);
      showToast(err?.message || "Could not update profile", "error");
      return false;
    }
  };

  const selectLesson = (moduleId: string, lessonId: string) => {
    triggerHaptic();
    const mod = modules.find((m) => m.id === moduleId);
    if (mod) {
      setSelectedModule(mod);
      const les = mod.lessons.find((l) => l.id === lessonId) || mod.lessons[0];
      setSelectedLesson(les);
      navigateTo("lesson-player");
    }
  };

  const markLessonComplete = async (lessonId: string, autoAdvance: boolean = false) => {
    triggerHaptic();
    const isEnrolled = Boolean(user?.isEnrolled);

    let nextLessonToSelect: Lesson | null = null;
    let nextModuleToSelect: Module | null = null;
    let updatedCurrentLesson: Lesson | null = null;
    let updatedCurrentModule: Module | null = null;

    setModules((prevModules) => {
      const updated = prevModules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((les) =>
          les.id === lessonId ? { ...les, isComplete: true, watchPercent: 100 } : les
        ),
      }));

      const locked = applySequentialLocking(updated, isEnrolled);

      // Find the updated current lesson and next lesson in sequence
      const allLessonsFlat: { module: Module; lesson: Lesson }[] = [];
      for (const m of locked) {
        for (const l of m.lessons) {
          allLessonsFlat.push({ module: m, lesson: l });
        }
      }

      const currentIndex = allLessonsFlat.findIndex((item) => item.lesson.id === lessonId);
      if (currentIndex >= 0) {
        updatedCurrentLesson = allLessonsFlat[currentIndex].lesson;
        updatedCurrentModule = allLessonsFlat[currentIndex].module;
        if (currentIndex < allLessonsFlat.length - 1) {
          nextLessonToSelect = allLessonsFlat[currentIndex + 1].lesson;
          nextModuleToSelect = allLessonsFlat[currentIndex + 1].module;
        }
      }

      return locked;
    });

    if (autoAdvance && nextLessonToSelect && nextModuleToSelect) {
      setSelectedModule(nextModuleToSelect);
      setSelectedLesson(nextLessonToSelect);
    } else if (updatedCurrentLesson && updatedCurrentModule) {
      setSelectedModule(updatedCurrentModule);
      setSelectedLesson(updatedCurrentLesson);
    }

    // Sync to Supabase — only when lesson_id is a real UUID (from Supabase, not local fallback)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);
    try {
      if (user?.id && isUuid) {
        await supabaseAdmin.from("lesson_progress").upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_complete: true,
          watch_percent: 100,
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" });
      }
    } catch (err) {
      console.warn("Could not sync lesson progress to Supabase:", err);
    }

    showToast("Lesson completed successfully!", "success");

    // Trigger local push notification on phone
    sendPushNotification(
      "Lesson Completed",
      `Great progress on ${selectedLesson.title}. Keep moving through the curriculum.`
    );

    addNotification({
      title: "Lesson Completed",
      message: `You marked '${selectedLesson.title}' as complete.`,
      type: "lesson",
      actionScreen: "learn",
    });
  };

  const addNotification = (notif: Omit<AppNotification, "id" | "timestamp" | "isRead">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: "notif-" + Date.now(),
      timestamp: "Just now",
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast("All notifications marked as read", "success");
  };

  const clearNotifications = () => {
    setNotifications([]);
    showToast("Notifications cleared", "info");
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        activeTab,
        screenHistory,
        user,
        modules,
        selectedModule,
        selectedLesson,
        certificate,
        notifications,
        toasts,
        isLoading,
        hasSeenOnboarding,
        navigateTo,
        goBack,
        setActiveTab,
        completeOnboarding,
        setUser,
        signOut,
        refreshUserData,
        updateProfile,
        enrolCourse,
        selectLesson,
        markLessonComplete,
        setCertificate,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
