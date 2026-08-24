import React, { useEffect } from "react";
import { useApp } from "./context/AppContext";
import { ToastContainer } from "./components/ui/ToastContainer";
import { setupBackButtonListener } from "./lib/native";

// 14 Screen Components
import { SplashScreen } from "./screens/01-SplashScreen";
import { Onboarding1Screen } from "./screens/02-Onboarding1Screen";
import { Onboarding2Screen } from "./screens/03-Onboarding2Screen";
import { Onboarding3Screen } from "./screens/04-Onboarding3Screen";
import { SignInScreen } from "./screens/05-SignInScreen";
import { OtpVerifyScreen } from "./screens/06-OtpVerifyScreen";
import { HomeScreen } from "./screens/07-HomeScreen";
import { LearnCurriculumScreen } from "./screens/08-LearnCurriculumScreen";
import { LessonPlayerScreen } from "./screens/09-LessonPlayerScreen";
import { ExamScreen } from "./screens/10-ExamScreen";
import { CertificateScreen } from "./screens/11-CertificateScreen";
import { VerifyScreen } from "./screens/12-VerifyScreen";
import { ProfileScreen } from "./screens/13-ProfileScreen";
import { NotificationScreen } from "./screens/14-NotificationScreen";
import { EnrolScreen } from "./screens/15-EnrolScreen";
import { AssignmentScreen } from "./screens/16-AssignmentScreen";

export const App: React.FC = () => {
  const { currentScreen, goBack } = useApp();

  useEffect(() => {
    setupBackButtonListener(() => {
      goBack();
    });
  }, [goBack]);

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash":
        return <SplashScreen />;
      case "onboarding-1":
        return <Onboarding1Screen />;
      case "onboarding-2":
        return <Onboarding2Screen />;
      case "onboarding-3":
        return <Onboarding3Screen />;
      case "sign-in":
        return <SignInScreen />;
      case "otp-verify":
        return <OtpVerifyScreen />;
      case "home":
        return <HomeScreen />;
      case "enrol":
        return <EnrolScreen />;
      case "learn":
        return <LearnCurriculumScreen />;
      case "lesson-player":
        return <LessonPlayerScreen />;
      case "exam":
        return <ExamScreen />;
      case "certificate":
        return <CertificateScreen />;
      case "verify":
        return <VerifyScreen />;
      case "profile":
        return <ProfileScreen />;
      case "notifications":
        return <NotificationScreen />;
      case "assignment":
        return <AssignmentScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const isDarkScreen = currentScreen === "splash";

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden select-none ${
        isDarkScreen ? "bg-[#0E1730]" : "bg-[#F6F1E6]"
      }`}
    >
      <ToastContainer />
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
        {renderScreen()}
      </div>
    </div>
  );

};
