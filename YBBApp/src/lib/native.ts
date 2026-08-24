import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Share } from "@capacitor/share";
import { Preferences } from "@capacitor/preferences";
import { App as CapApp } from "@capacitor/app";

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  try {
    await Haptics.impact({ style });
  } catch {
    // Fallback silently in browser mode
  }
};

export const setStatusBarTheme = async (isDark: boolean) => {
  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDark ? "#0E1730" : "#F6F1E6",
    });
  } catch {
    // Fallback silently in browser mode
  }
};

export const shareContent = async (title: string, text: string, url?: string) => {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    await Share.share({
      title,
      text,
      url,
      dialogTitle: "Share ABB Credential",
    });
    return true;
  } catch {
    return false;
  }
};

export const saveStorage = async (key: string, value: string) => {
  try {
    await Preferences.set({ key, value });
  } catch {
    localStorage.setItem(key, value);
  }
};

export const getStorage = async (key: string): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key });
    return value ?? localStorage.getItem(key);
  } catch {
    return localStorage.getItem(key);
  }
};

export const removeStorage = async (key: string) => {
  try {
    await Preferences.remove({ key });
    localStorage.removeItem(key);
  } catch {
    localStorage.removeItem(key);
  }
};

export const setupBackButtonListener = (onBack: () => void) => {
  try {
    CapApp.addListener("backButton", () => {
      onBack();
    });
  } catch {
    // Ignore in browser
  }
};
