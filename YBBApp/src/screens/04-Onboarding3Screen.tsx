import React from "react";
import { useApp } from "../context/AppContext";

function IllustrationCertificate() {
  return (
    <svg viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 300, height: "auto" }}>
      {/* Certificate paper */}
      <rect x="40" y="45" width="200" height="155" rx="16" fill="white" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))" }} />
      <rect x="40" y="45" width="200" height="155" rx="16" stroke="#E7CE9C" strokeWidth="2" />
      {/* Inner border frame */}
      <rect x="52" y="57" width="176" height="131" rx="10" stroke="#E7CE9C" strokeWidth="1" strokeDasharray="4 3" />

      {/* Top decoration bar */}
      <rect x="40" y="45" width="200" height="16" rx="16 16 0 0" fill="#132242" />
      <rect x="40" y="52" width="200" height="9" fill="#132242" />

      {/* Seal / medal */}
      <circle cx="140" cy="105" r="30" fill="#FBF7EE" stroke="#B4863A" strokeWidth="2" />
      <circle cx="140" cy="105" r="23" fill="#F6F1E6" stroke="#B4863A" strokeWidth="1.5" strokeDasharray="3 2.5" />
      <circle cx="140" cy="105" r="16" fill="#132242" />
      {/* ABB text in seal */}
      <text x="140" y="101" textAnchor="middle" fill="#E7CE9C" fontSize="7" fontWeight="bold" fontFamily="Georgia, serif">ABB</text>
      <text x="140" y="112" textAnchor="middle" fill="#B4863A" fontSize="5" fontFamily="Georgia, serif">CERTIFIED</text>

      {/* Ribbon tails */}
      <polygon points="125,132 135,122 135,148 130,152" fill="#B4863A" opacity="0.7" />
      <polygon points="155,132 145,122 145,148 150,152" fill="#B4863A" opacity="0.7" />

      {/* Certificate lines */}
      <rect x="80" y="160" width="120" height="4" rx="2" fill="#EEE6D3" />
      <rect x="95" y="170" width="90" height="3.5" rx="2" fill="#F0EAD8" />

      {/* Stars decoration on sides */}
      <path d="M68 95l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="#E7CE9C" opacity="0.6" />
      <path d="M212 95l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="#E7CE9C" opacity="0.6" />

      {/* Floating success badge */}
      <rect x="185" y="30" width="72" height="42" rx="12" fill="white" style={{ filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.09))" }} />
      <rect x="185" y="30" width="72" height="42" rx="12" stroke="#E1D8C2" strokeWidth="1" />
      <circle cx="204" cy="48" r="8" fill="#1E4B3E" />
      <path d="M200 48l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="217" y="42" width="32" height="5" rx="2.5" fill="#E1D8C2" />
      <rect x="217" y="51" width="22" height="4" rx="2" fill="#EEE6D3" />

      {/* Floating scan badge */}
      <rect x="24" y="145" width="64" height="56" rx="12" fill="white" style={{ filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.09))" }} />
      <rect x="24" y="145" width="64" height="56" rx="12" stroke="#E1D8C2" strokeWidth="1" />
      {/* QR code hint */}
      <rect x="34" y="155" width="8" height="8" rx="1.5" fill="#132242" />
      <rect x="46" y="155" width="8" height="8" rx="1.5" fill="#132242" />
      <rect x="58" y="155" width="8" height="8" rx="1.5" fill="#132242" />
      <rect x="34" y="167" width="8" height="8" rx="1.5" fill="#132242" />
      <rect x="46" y="167" width="8" height="8" rx="1.5" fill="#132242" />
      <rect x="58" y="167" width="8" height="8" rx="1.5" fill="#132242" />
      <rect x="34" y="179" width="32" height="4" rx="2" fill="#B4863A" opacity="0.5" />
      <rect x="70" y="179" width="8" height="4" rx="2" fill="#132242" />
      <rect x="34" y="186" width="20" height="4" rx="2" fill="#EEE6D3" />
      <rect x="58" y="186" width="20" height="4" rx="2" fill="#EEE6D3" />

      {/* Decorative dots */}
      <circle cx="248" cy="200" r="7" fill="#B4863A" opacity="0.12" />
      <circle cx="20" cy="110" r="5" fill="#132242" opacity="0.07" />
      <circle cx="258" cy="50" r="4" fill="#B4863A" opacity="0.15" />
    </svg>
  );
}

export const Onboarding3Screen: React.FC = () => {
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
        <IllustrationCertificate />
      </div>

      {/* Bottom content */}
      <div style={{ padding: "0 28px 40px", flexShrink: 0 }}>
        {/* Dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 22 }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, background: "#E1D8C2" }} />
          <div style={{ width: 7, height: 7, borderRadius: 4, background: "#E1D8C2" }} />
          <div style={{ width: 22, height: 7, borderRadius: 4, background: "#132242" }} />
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
          Earn a Verifiable Credential
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: "#7A7160",
          textAlign: "center",
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          Pass the final exam and receive your unique ABB ID — instantly verifiable by clients and employers.
        </p>

        {/* Get Started button */}
        <button
          type="button"
          onClick={() => navigateTo("sign-in")}
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
            marginBottom: 10,
            letterSpacing: "0.02em",
          }}
        >
          Get Started
        </button>

        {/* Sign Up secondary */}
        <button
          type="button"
          onClick={completeOnboarding}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            background: "transparent",
            color: "#132242",
            fontSize: 15,
            fontWeight: 600,
            border: "1.5px solid #E1D8C2",
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};
