import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Seal } from "../components/ui/Seal";

export const SplashScreen: React.FC = () => {
  const { navigateTo, user, hasSeenOnboarding, isLoading } = useApp();
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(65), 350);
    const timer2 = setTimeout(() => setProgress(100), 900);
    const timer3 = setTimeout(() => {
      if (user) {
        navigateTo("home", false);
      } else if (!hasSeenOnboarding) {
        navigateTo("onboarding-1", false);
      } else {
        navigateTo("sign-in", false);
      }
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [navigateTo, user, hasSeenOnboarding, isLoading]);

  const handleSkip = () => {
    if (user) {
      navigateTo("home");
    } else if (!hasSeenOnboarding) {
      navigateTo("onboarding-1");
    } else {
      navigateTo("sign-in");
    }
  };

  return (
    <div
      onClick={handleSkip}
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[#0E1730] text-[#FBF7EE] select-none cursor-pointer overflow-hidden p-6"
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10 w-full px-6">
        {/* Pulsing glow behind logo */}
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 rounded-full bg-[#B4863A]/20 blur-2xl scale-150 animate-pulse" />
          <img
            src="/logo_header.png"
            alt="YBB - Yoova Business Broking"
            className="h-16 max-w-[240px] object-contain brightness-0 invert drop-shadow-md relative z-10"
          />
        </div>

        <div className="text-center">
          <div className="font-serif italic font-medium text-[17px] text-[#E7CE9C] tracking-wide">
            Authorised Business Broker
          </div>
          <div className="text-[11px] tracking-[0.2em] text-[#B9C0D6] uppercase font-mono mt-1.5 opacity-80">
            Certification Programme
          </div>
        </div>
      </div>

      {/* Progress loader at bottom */}
      <div className="w-full flex justify-center pb-10 z-10">
        <div className="w-36 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E7CE9C] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
