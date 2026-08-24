import React from "react";
import { useApp } from "../context/AppContext";

function IllustrationModules() {
  return (
    <svg viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 300, height: "auto" }}>
      {/* Desk surface */}
      <rect x="20" y="190" width="240" height="12" rx="6" fill="#E8DCC8" />
      {/* Laptop body */}
      <rect x="60" y="110" width="160" height="100" rx="10" fill="#132242" />
      {/* Laptop screen */}
      <rect x="70" y="118" width="140" height="80" rx="6" fill="#1E3360" />
      {/* Screen content - video play area */}
      <rect x="78" y="124" width="124" height="68" rx="4" fill="#0F1D3A" />
      {/* Play button */}
      <circle cx="140" cy="158" r="18" fill="#B4863A" opacity="0.9" />
      <path d="M134 151l16 7-16 7V151z" fill="white" />
      {/* Progress bar */}
      <rect x="78" y="196" width="124" height="3" rx="1.5" fill="#2A3E6A" />
      <rect x="78" y="196" width="60" height="3" rx="1.5" fill="#B4863A" />
      {/* Laptop base */}
      <rect x="50" y="200" width="180" height="8" rx="4" fill="#0E1A35" />
      {/* Keyboard keys hint */}
      <rect x="75" y="204" width="130" height="2" rx="1" fill="#1A2A50" />

      {/* Floating card 1 - Modules */}
      <rect x="8" y="85" width="85" height="55" rx="12" fill="white" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.10))" }} />
      <rect x="18" y="96" width="20" height="20" rx="6" fill="#132242" />
      <path d="M23 106l4 4 6-6" stroke="#E7CE9C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="46" y="98" width="38" height="5" rx="2.5" fill="#E1D8C2" />
      <rect x="46" y="107" width="28" height="4" rx="2" fill="#EEE6D3" />
      <rect x="18" y="120" width="58" height="3" rx="1.5" fill="#B4863A" opacity="0.4" />
      <rect x="18" y="120" width="28" height="3" rx="1.5" fill="#B4863A" />
      <rect x="76" y="126" width="8" height="8" rx="4" fill="#E7CE9C" />

      {/* Floating card 2 - Certificate preview */}
      <rect x="188" y="70" width="84" height="56" rx="12" fill="white" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.10))" }} />
      <circle cx="210" cy="91" r="12" fill="#F6F1E6" stroke="#B4863A" strokeWidth="1.5" />
      <path d="M204 91l4 4 6-8" stroke="#B4863A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="228" y="83" width="36" height="5" rx="2.5" fill="#E1D8C2" />
      <rect x="228" y="92" width="26" height="4" rx="2" fill="#EEE6D3" />
      <rect x="200" y="108" width="64" height="3" rx="1.5" fill="#1E4B3E" opacity="0.3" />
      <rect x="200" y="108" width="38" height="3" rx="1.5" fill="#1E4B3E" opacity="0.7" />

      {/* Floating dot accents */}
      <circle cx="30" cy="55" r="6" fill="#B4863A" opacity="0.15" />
      <circle cx="250" cy="50" r="9" fill="#132242" opacity="0.08" />
      <circle cx="260" cy="180" r="5" fill="#B4863A" opacity="0.2" />
      <circle cx="18" cy="175" r="4" fill="#132242" opacity="0.1" />

      {/* Person silhouette studying */}
      <circle cx="210" cy="152" r="14" fill="#F6F1E6" stroke="#E1D8C2" strokeWidth="1.5" />
      <circle cx="210" cy="146" r="7" fill="#E1D8C2" />
      <path d="M196 168c0-8 6-14 14-14s14 6 14 14" fill="#E8DCC8" />
    </svg>
  );
}

export const Onboarding1Screen: React.FC = () => {
  const { navigateTo, completeOnboarding } = useApp();

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "#FFFDF8",
      userSelect: "none",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "48px 28px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="/logo_header.png"
          alt="YBB"
          style={{ height: 32, maxWidth: 160, objectFit: "contain" }}
        />
      </div>

      {/* Illustration area */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px 8px",
      }}>
        <IllustrationModules />
      </div>

      {/* Bottom content */}
      <div style={{ padding: "0 28px 40px", flexShrink: 0 }}>
        {/* Dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 22 }}>
          <div style={{ width: 22, height: 7, borderRadius: 4, background: "#132242" }} />
          <div style={{ width: 7, height: 7, borderRadius: 4, background: "#E1D8C2" }} />
          <div style={{ width: 7, height: 7, borderRadius: 4, background: "#E1D8C2" }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          fontSize: 24,
          color: "#132242",
          textAlign: "center",
          lineHeight: 1.25,
          marginBottom: 10,
        }}>
          Learn the Business of Broking
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: "#7A7160",
          textAlign: "center",
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          11 expert-led video modules — from finding sellers to closing deals, at your own pace.
        </p>

        {/* Next button */}
        <button
          type="button"
          onClick={() => navigateTo("onboarding-2")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            background: "#132242",
            color: "#FFFDF8",
            fontSize: 15,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            marginBottom: 14,
            letterSpacing: "0.02em",
          }}
        >
          Next
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={completeOnboarding}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            color: "#9A9080",
            cursor: "pointer",
            padding: "4px",
            textAlign: "center",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
};
