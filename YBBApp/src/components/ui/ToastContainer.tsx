import React from "react";
import { useApp } from "../../context/AppContext";

const TOAST_CONFIG = {
  success: {
    bg: "rgba(240, 249, 245, 0.98)",
    border: "rgba(52, 168, 117, 0.3)",
    accent: "#34A875",
    iconBg: "rgba(52, 168, 117, 0.12)",
    iconColor: "#1E7A52",
    textColor: "#1A3D2B",
    subtextColor: "#4A7A5F",
    label: "Success",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: "rgba(255, 245, 244, 0.98)",
    border: "rgba(220, 80, 60, 0.3)",
    accent: "#DC503C",
    iconBg: "rgba(220, 80, 60, 0.1)",
    iconColor: "#B03020",
    textColor: "#3D1A16",
    subtextColor: "#8A4030",
    label: "Error",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    bg: "rgba(253, 250, 243, 0.98)",
    border: "rgba(180, 134, 58, 0.3)",
    accent: "#B4863A",
    iconBg: "rgba(180, 134, 58, 0.12)",
    iconColor: "#8C6425",
    textColor: "#2A2010",
    subtextColor: "#7A6030",
    label: "Info",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 52,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const cfg = TOAST_CONFIG[toast.type as keyof typeof TOAST_CONFIG] ?? TOAST_CONFIG.info;

        return (
          <div
            key={toast.id}
            role="alert"
            onClick={() => removeToast(toast.id)}
            className="animate-slide-down"
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 380,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderLeft: `4px solid ${cfg.accent}`,
              borderRadius: 16,
              padding: "12px 14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
              cursor: "pointer",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: cfg.iconBg,
                color: cfg.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {cfg.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: cfg.accent,
                  marginBottom: 2,
                  lineHeight: 1,
                }}
              >
                {cfg.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: cfg.textColor,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {toast.message}
              </div>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              aria-label="Dismiss"
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: cfg.subtextColor,
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
