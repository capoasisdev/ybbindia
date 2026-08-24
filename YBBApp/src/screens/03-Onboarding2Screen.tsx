import React from "react";
import { useApp } from "../context/AppContext";

function IllustrationPractice() {
  return (
    <svg viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 300, height: "auto" }}>
      {/* Main clipboard / workbook */}
      <rect x="60" y="40" width="160" height="185" rx="14" fill="white" style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.09))" }} />
      <rect x="60" y="40" width="160" height="185" rx="14" stroke="#E1D8C2" strokeWidth="1.5" />
      {/* Clipboard top clip */}
      <rect x="105" y="30" width="70" height="22" rx="11" fill="#E1D8C2" />
      <rect x="118" y="35" width="44" height="12" rx="6" fill="#FFFDF8" />

      {/* Workbook lines */}
      <rect x="80" y="75" width="120" height="4" rx="2" fill="#F0EAD8" />
      <rect x="80" y="88" width="100" height="4" rx="2" fill="#F0EAD8" />
      <rect x="80" y="101" width="110" height="4" rx="2" fill="#F0EAD8" />

      {/* Task rows with checkboxes */}
      {[130, 152, 174].map((y, i) => (
        <g key={y}>
          <rect x="80" y={y} width="16" height="16" rx="5"
            fill={i < 2 ? "#132242" : "#F0EAD8"}
            stroke={i < 2 ? "none" : "#DDD3BE"}
            strokeWidth="1.5"
          />
          {i < 2 && <path d={`M${83} ${y + 8}l4 4 6-7`} stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="104" y={y + 4} width={i === 1 ? 70 : 85} height="5" rx="2.5" fill={i < 2 ? "#E1D8C2" : "#F0EAD8"} />
        </g>
      ))}

      {/* Gold accent bar at bottom of card */}
      <rect x="60" y="212" width="160" height="13" rx="0" fill="#B4863A" opacity="0.12" />
      <rect x="60" y="218" width="160" height="7" rx="0 0 14 14" fill="#B4863A" opacity="0.08" />

      {/* Pen/pencil */}
      <g transform="rotate(-30, 195, 170)">
        <rect x="183" y="155" width="10" height="50" rx="3" fill="#132242" />
        <polygon points="183,205 193,205 188,220" fill="#E7CE9C" />
        <rect x="183" y="155" width="10" height="8" rx="3 3 0 0" fill="#B4863A" />
      </g>

      {/* Floating star / badge */}
      <circle cx="228" cy="55" r="26" fill="#FBF7EE" style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.09))" }} />
      <circle cx="228" cy="55" r="26" stroke="#E7CE9C" strokeWidth="1.5" />
      <path d="M228 38l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" fill="#B4863A" />

      {/* Floating mini-card left */}
      <rect x="8" y="100" width="62" height="50" rx="12" fill="white" style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.08))" }} />
      <rect x="8" y="100" width="62" height="50" rx="12" stroke="#E1D8C2" strokeWidth="1" />
      <circle cx="30" cy="120" r="9" fill="#F6F1E6" stroke="#132242" strokeWidth="1.5" />
      <path d="M26 120l3 3 5-5" stroke="#132242" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="115" width="18" height="4" rx="2" fill="#E1D8C2" />
      <rect x="44" y="123" width="13" height="3" rx="1.5" fill="#EEE6D3" />
      <rect x="18" y="135" width="42" height="3" rx="1.5" fill="#B4863A" opacity="0.3" />
      <rect x="18" y="135" width="22" height="3" rx="1.5" fill="#B4863A" opacity="0.7" />

      {/* Decoration dots */}
      <circle cx="22" cy="70" r="5" fill="#132242" opacity="0.07" />
      <circle cx="258" cy="170" r="7" fill="#B4863A" opacity="0.13" />
      <circle cx="248" cy="130" r="4" fill="#132242" opacity="0.07" />
    </svg>
  );
}

export const Onboarding2Screen: React.FC = () => {
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

      {/* Illustration */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px 8px",
      }}>
        <IllustrationPractice />
      </div>

      {/* Bottom content */}
      <div style={{ padding: "0 28px 40px", flexShrink: 0 }}>
        {/* Dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 22 }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, background: "#E1D8C2" }} />
          <div style={{ width: 22, height: 7, borderRadius: 4, background: "#132242" }} />
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
          Apply What You Learn
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: "#7A7160",
          textAlign: "center",
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          Every module comes with a practical assignment reviewed and graded by YBB's certification team.
        </p>

        {/* Next button */}
        <button
          type="button"
          onClick={() => navigateTo("onboarding-3")}
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
