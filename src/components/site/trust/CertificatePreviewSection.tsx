import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/site/Wordmark";

/** Detailed Guilloche SVG Border Frame for Classic Certificate */
function GuillocheBorderFrame() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <pattern
          id="guilloche-edge-h"
          width="40"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0,8 Q10,0 20,8 T40,8 M0,8 Q10,16 20,8 T40,8"
            stroke="#2563eb"
            strokeWidth="0.75"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M0,4 Q10,12 20,4 T40,4 M0,12 Q10,4 20,12 T40,12"
            stroke="#1d4ed8"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
        </pattern>
        <pattern
          id="guilloche-edge-v"
          width="16"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M8,0 Q0,10 8,20 T8,40 M8,0 Q16,10 8,20 T8,40"
            stroke="#2563eb"
            strokeWidth="0.75"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M4,0 Q12,10 4,20 T4,40 M12,0 Q4,10 12,20 T12,40"
            stroke="#1d4ed8"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
        </pattern>
      </defs>

      {/* Double Border Rectangles */}
      <rect
        x="6"
        y="6"
        width="calc(100% - 12px)"
        height="calc(100% - 12px)"
        stroke="#1e40af"
        strokeWidth="3"
        fill="none"
        rx="4"
      />
      <rect
        x="14"
        y="14"
        width="calc(100% - 28px)"
        height="calc(100% - 28px)"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        fill="none"
        rx="2"
      />
      <rect
        x="20"
        y="20"
        width="calc(100% - 40px)"
        height="calc(100% - 40px)"
        stroke="#1d4ed8"
        strokeWidth="1"
        fill="none"
      />

      {/* Guilloche Corner Rosettes */}
      {[
        { top: 12, left: 12, rotate: 0 },
        { top: 12, right: 12, rotate: 90 },
        { bottom: 12, right: 12, rotate: 180 },
        { bottom: 12, left: 12, rotate: 270 },
      ].map((pos, idx) => (
        <g
          key={idx}
          transform={`translate(${pos.left ?? "calc(100% - " + pos.right + "px)"}, ${
            pos.top ?? "calc(100% - " + pos.bottom + "px)"
          }) rotate(${pos.rotate})`}
        >
          <circle cx="16" cy="16" r="14" stroke="#1e40af" strokeWidth="1" fill="none" opacity="0.6" />
          <circle cx="16" cy="16" r="10" stroke="#2563eb" strokeWidth="0.75" fill="none" opacity="0.5" />
          <path
            d="M16,2 L16,30 M2,16 L30,16 M6,6 L26,26 M6,26 L26,6"
            stroke="#1d4ed8"
            strokeWidth="0.5"
            opacity="0.4"
          />
        </g>
      ))}
    </svg>
  );
}

/** Metallic Gold Scalloped Achievement Medal Seal */
function GoldAchievementSeal() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Serrated Gold Starburst Ribbon */}
      <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-1 shadow-lg shadow-amber-600/30">
        {/* Scalloped edge simulation */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-200 opacity-60" />
        
        {/* Inner Gold Disc */}
        <div className="flex size-full flex-col items-center justify-center rounded-full border-2 border-amber-100/80 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 text-amber-950 p-2 shadow-inner text-center">
          {/* Circular Text Badge */}
          <span className="font-sans text-[0.42rem] font-black uppercase tracking-widest text-amber-950 drop-shadow-xs">
            ACHIEVEMENT
          </span>

          {/* Center Rosette / Star Emblem */}
          <div className="my-0.5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="size-6 text-amber-950 fill-amber-950">
              <path d="M12,2 L14.5,8.5 L21.5,9 L16,13.5 L18,20 L12,16.5 L6,20 L8,13.5 L2.5,9 L9.5,8.5 Z" />
            </svg>
          </div>

          <span className="font-sans text-[0.4rem] font-bold uppercase tracking-wider text-amber-900">
            YBB OFFICIAL
          </span>
        </div>
      </div>
    </div>
  );
}

export function CertificatePreviewSection() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          {/* Content column */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Certificate Preview
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              A Credential That Can Be Verified
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Every successful ABB learner receives a personalised certificate with a unique ABB
              ID. The certificate can be verified through the YBB website, allowing clients,
              employers and professional contacts to confirm:
            </p>

            <ul className="mt-8 space-y-3.5 text-sm text-foreground/90">
              {[
                "Learner's full name",
                "Unique ABB ID (e.g., YBB-ABB-2026-0001)",
                "Certificate issue date & validity status",
                "Current status (Active / Verified)",
                "Issuing organisation (Yoova Business Broking Pvt Ltd)",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <BadgeCheck className="size-5 shrink-0 text-accent" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button size="lg" asChild className="group rounded-lg px-7">
                <Link to="/verify">
                  Verify an ABB Certificate
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Classic Certificate Replica matching provided image */}
          <div className="relative rounded-xl bg-white p-3 shadow-2xl ring-1 ring-slate-900/10">
            {/* Outer Blue Guilloche Border Frame Container */}
            <div className="relative overflow-hidden rounded-lg bg-slate-50 p-6 sm:p-10 text-slate-900 shadow-inner">
              <GuillocheBorderFrame />

              {/* YBB diagonal watermark overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden opacity-[0.06]"
              >
                <span className="rotate-[-28deg] select-none font-display text-8xl sm:text-9xl font-black uppercase tracking-[0.25em] text-blue-900">
                  YBB
                </span>
              </div>

              {/* Certificate Inner Canvas */}
              <div className="relative z-10 py-4 px-2 sm:px-6">
                
                {/* 1. Header: "Certificate of Completion" in Old English / Blackletter styling */}
                <div className="text-center">
                  <h3
                    className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950"
                    style={{
                      fontFamily: "'Old English Text MT', 'UnifrakturMaguntia', 'Chau Philomene One', 'Georgia', serif",
                    }}
                  >
                    Certificate of Completion
                  </h3>
                </div>

                {/* 2. Section 1: "THIS ACKNOWLEDGES THAT" */}
                <div className="mt-8 text-center sm:mt-10">
                  <p className="text-xs sm:text-sm font-sans font-medium uppercase tracking-[0.2em] text-slate-700">
                    THIS ACKNOWLEDGES THAT
                  </p>
                </div>

                {/* 3. Section 2: [firstname] [lastname] */}
                <div className="mt-3 text-center sm:mt-4">
                  <h4 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                    Rajesh Sharma
                  </h4>
                </div>

                {/* 4. Section 3: "HAS COMPLETED THE REQUIREMENTS FOR" */}
                <div className="mt-7 text-center sm:mt-8">
                  <p className="text-xs sm:text-sm font-sans font-medium uppercase tracking-[0.18em] text-slate-700">
                    HAS COMPLETED THE REQUIREMENTS FOR
                  </p>
                </div>

                {/* 5. Section 4: [course_name] */}
                <div className="mt-3 text-center sm:mt-4">
                  <p className="font-sans text-base sm:text-lg md:text-xl font-bold text-slate-900 max-w-lg mx-auto leading-snug">
                    Authorised Business Broker (ABB) Certification Programme
                  </p>
                </div>

                {/* 6. Bottom Row: 3-column Layout (Logo | Gold Seal | Date Complete) */}
                <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 items-end justify-between text-center sm:grid-cols-3 sm:text-left">
                  
                  {/* Left: Organization Logo */}
                  <div className="flex flex-col items-center sm:items-start justify-end">
                    <div className="scale-90 origin-bottom-left">
                      <Wordmark tone="dark" />
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Yoova Business Broking Pvt Ltd
                    </p>
                  </div>

                  {/* Center: Gold Achievement Medal Seal */}
                  <div className="flex items-center justify-center">
                    <GoldAchievementSeal />
                  </div>

                  {/* Right: Date Complete & Date Awarded Line */}
                  <div className="flex flex-col items-center sm:items-end justify-end">
                    <div className="w-44 text-center border-b border-slate-700 pb-1">
                      <span className="font-mono text-sm sm:text-base font-semibold text-slate-900">
                        8/14/2026
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-sans font-bold uppercase tracking-widest text-slate-600">
                      DATE AWARDED
                    </p>
                  </div>

                </div>

                {/* Micro Verification Footer */}
                <div className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500 font-mono">
                  Credential ID: <span className="font-bold text-slate-800">YBB-ABB-2026-0001</span> • Verify online at <span className="text-blue-700 font-bold">www.ybbindia.com/verify</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


