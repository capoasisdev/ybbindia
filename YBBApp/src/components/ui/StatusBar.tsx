import React from "react";

interface StatusBarProps {
  dark?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = () => {
  // On real mobile devices, the native Android OS already renders the top status bar.
  // We simply provide top safe area spacing so content doesn't collide with the notch / status bar.
  return <div className="h-2 shrink-0 w-full" />;
};
