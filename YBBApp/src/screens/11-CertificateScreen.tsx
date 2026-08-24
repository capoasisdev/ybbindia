import React, { useRef } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { Seal } from "../components/ui/Seal";
import { shareContent } from "../lib/native";
import jsPDF from "jspdf";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: number,
  outer: number,
  inner: number,
  color: string
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    if (i === 0) {
      ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    } else {
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export const CertificateScreen: React.FC = () => {
  const { certificate, user, navigateTo, showToast, modules } = useApp();
  const certRef = useRef<HTMLDivElement>(null);

  const completedModulesCount = modules.filter((m) => m.status === "completed").length;
  const isAllModulesComplete = modules.length > 0 && completedModulesCount === modules.length;
  const isEligible = certificate !== null;

  const learnerName = certificate?.learnerName || user?.name || "Authorised Business Broker";
  const credId = certificate?.abbId || user?.abbId || "YBB-ABB-2026-1580";
  const issueDate = certificate?.issuedAt || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleShare = async () => {
    const success = await shareContent(
      "YBB Authorised Business Broker Certificate",
      `I have successfully earned my Authorised Business Broker (ABB) Certification from Yoova Business Broking! Credential ID: ${credId}`,
      `https://ybbindia.com/verify?abbId=${credId}`
    );

    if (success) {
      showToast("Certificate shared successfully!", "success");
    } else {
      showToast(`Verification link copied for ${credId}`, "info");
    }
  };

async function ensureFontsLoaded() {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load("italic 600 48px Fraunces"),
        document.fonts.load("bold 25px Fraunces"),
        document.fonts.load("bold 19px Fraunces"),
        document.fonts.load("16.5px 'Public Sans'"),
        document.fonts.load("bold 17px 'IBM Plex Mono'"),
      ]);
    } catch {
      // Continue if font load throws
    }
  }
}

  const handleDownloadPdf = async () => {
    try {
      showToast("Generating high-resolution certificate PDF…", "info");
      await ensureFontsLoaded();

      const LW = 1000, LH = 707; // Standard A4 Landscape aspect ratio (1.414)
      const SC = 3; // 3x retina scaling for crystal clear 300-DPI print quality
      const W = Math.round(LW * SC);
      const H = Math.round(LH * SC);

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(SC, SC);

      // Warm Cream Background (#FFFDF8)
      ctx.fillStyle = "#FFFDF8";
      ctx.fillRect(0, 0, LW, LH);

      // Subtle vertical watermark pinstripes
      ctx.strokeStyle = "rgba(246, 241, 230, 0.75)";
      ctx.lineWidth = 1;
      for (let x = 10; x < LW; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, LH);
        ctx.stroke();
      }

      // Ornate Double Borders
      ctx.strokeStyle = "#8C6425";
      ctx.lineWidth = 3;
      roundRect(ctx, 24, 24, LW - 48, LH - 48, 18);
      ctx.stroke();

      ctx.strokeStyle = "#E1D8C2";
      ctx.lineWidth = 1.5;
      roundRect(ctx, 36, 36, LW - 72, LH - 72, 12);
      ctx.stroke();

      // Corner bracket accents
      const drawCornerAccent = (x: number, y: number, isRight: boolean, isBottom: boolean) => {
        ctx.strokeStyle = "#8C6425";
        ctx.lineWidth = 3;
        ctx.beginPath();
        const len = 20;
        const dx = isRight ? -len : len;
        const dy = isBottom ? -len : len;
        ctx.moveTo(x + dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy);
        ctx.stroke();
      };
      drawCornerAccent(30, 30, false, false);
      drawCornerAccent(LW - 30, 30, true, false);
      drawCornerAccent(30, LH - 30, false, true);
      drawCornerAccent(LW - 30, LH - 30, true, true);

      const cx = LW / 2;

      // Logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = "/logo_header.png";
        await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve();
          setTimeout(resolve, 800);
        });
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          const logoH = 50;
          const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
          ctx.drawImage(logoImg, cx - logoW / 2, 60, logoW, logoH);
        } else {
          ctx.fillStyle = "#132242";
          ctx.font = "bold 24px 'Fraunces', Georgia, serif";
          ctx.textAlign = "center";
          ctx.fillText("YOOVA BUSINESS BROKING", cx, 95);
        }
      } catch {
        ctx.fillStyle = "#132242";
        ctx.font = "bold 24px 'Fraunces', Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("YOOVA BUSINESS BROKING", cx, 95);
      }

      // Title
      ctx.fillStyle = "#7A7160";
      ctx.font = "bold 13px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE OF COMPLETION", cx, 142);

      // Recipient Name
      ctx.fillStyle = "#132242";
      ctx.font = "italic 600 48px 'Fraunces', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(learnerName, cx, 218);

      // Statement
      ctx.fillStyle = "#5A6786";
      ctx.font = "16.5px 'Public Sans', system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "has completed the requirements for the",
        cx,
        290
      );

      ctx.fillStyle = "#132242";
      ctx.font = "bold 25px 'Fraunces', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Authorised Business Broker (ABB)",
        cx,
        330
      );

      ctx.fillStyle = "#132242";
      ctx.font = "bold 19px 'Fraunces', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Certification Programme",
        cx,
        362
      );

      // Brass Seal
      const sealY = 442;
      const sealR = 38;

      const drawFlourishLine = (x1: number, x2: number) => {
        const g = ctx.createLinearGradient(x1, 0, x2, 0);
        g.addColorStop(x1 < cx ? 0 : 1, "rgba(225, 216, 194, 0)");
        g.addColorStop(x1 < cx ? 1 : 0, "#B4863A");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, sealY);
        ctx.lineTo(x2, sealY);
        ctx.stroke();
      };
      drawFlourishLine(cx - 240, cx - 55);
      drawFlourishLine(cx + 55, cx + 240);

      const sealGrad = ctx.createRadialGradient(cx, sealY, 2, cx, sealY, sealR);
      sealGrad.addColorStop(0, "#FFFDF8");
      sealGrad.addColorStop(0.6, "#FAF4E6");
      sealGrad.addColorStop(1, "#E7CE9C");
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(cx, sealY, sealR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#B4863A";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = "#8C6425";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, sealY, sealR - 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      drawStar(ctx, cx, sealY, 5, 16, 7.5, "#8C6425");

      // Divider
      ctx.strokeStyle = "#E1D8C2";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 280, 520);
      ctx.lineTo(cx + 280, 520);
      ctx.stroke();

      // Metadata Row
      // Left: Credential ID
      ctx.fillStyle = "#7A7160";
      ctx.font = "bold 11.5px 'Public Sans', system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("CREDENTIAL ID", cx - 260, 568);

      ctx.fillStyle = "#132242";
      ctx.font = "bold 17px 'IBM Plex Mono', monospace";
      ctx.fillText(credId, cx - 260, 596);

      // Right: Issued Date
      ctx.fillStyle = "#7A7160";
      ctx.font = "bold 11.5px 'Public Sans', system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("ISSUED", cx + 260, 568);

      ctx.fillStyle = "#132242";
      ctx.font = "bold 17px 'IBM Plex Mono', monospace";
      ctx.fillText(issueDate, cx + 260, 596);

      // PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`YBB_ABB_Certificate_${credId}.pdf`);

      showToast("Certificate PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      showToast("Could not generate PDF", "error");
    }
  };

  // -------------------------------------------------------------
  // LOCKED / NOT YET EARNED VIEW
  // -------------------------------------------------------------
  if (!isEligible) {
    return (
      <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
        <TopBar title="Your Certificate" showBack={true} />

        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center">
            {/* Certificate Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#0E1730] text-[#E7CE9C] flex items-center justify-center mb-4 shadow-md">
              <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
                <path d="M12 15l-3-3m0 0l3-3m-3 3h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>

            <h1 className="font-serif font-bold text-[22px] text-[#132242] mb-2 leading-snug">
              Certificate Not Yet Issued
            </h1>
            <p className="text-[13px] text-[#7A7160] leading-relaxed max-w-xs mb-6">
              Your official ABB Credential ID and digital certificate will be generated as soon as you complete the requirements.
            </p>

            {/* Certification Steps Checklist */}
            <div className="w-full flex flex-col gap-2.5 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7160] px-1">
                Certification Steps
              </div>

              {/* Step 1 */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E1D8C2]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isAllModulesComplete ? "bg-[#1E4B3E] text-white" : "bg-[#EEE6D3] text-[#7A7160]"
                  }`}
                >
                  {isAllModulesComplete ? (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#132242]">
                    1. Complete Curriculum
                  </div>
                  <div className="text-[11px] text-[#7A7160]">
                    {completedModulesCount} of {modules.length} modules finished
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E1D8C2]">
                <div className="w-6 h-6 rounded-full bg-[#EEE6D3] text-[#7A7160] flex items-center justify-center shrink-0">
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#132242]">
                    2. Pass Final Examination
                  </div>
                  <div className="text-[11px] text-[#7A7160]">
                    Score 70% or higher to qualify
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E1D8C2]">
                <div className="w-6 h-6 rounded-full bg-[#EEE6D3] text-[#7A7160] flex items-center justify-center shrink-0">
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M12 15l-3-3m0 0l3-3m-3 3h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#132242]">
                    3. Digital Certificate Generation
                  </div>
                  <div className="text-[11px] text-[#7A7160]">
                    Downloadable PDF &amp; QR verification
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 pb-4">
            <button
              type="button"
              onClick={() => {
                if (!user?.isEnrolled) {
                  navigateTo("enrol");
                } else if (isAllModulesComplete) {
                  navigateTo("exam");
                } else {
                  navigateTo("learn");
                }
              }}
              className="btn btn-primary w-full text-[14px] flex items-center justify-center gap-2 shadow-xs"
            >
              <span>
                {!user?.isEnrolled
                  ? "Enrol in Programme"
                  : isAllModulesComplete
                  ? "Take Final Examination"
                  : "Go to Curriculum"}
              </span>
              <svg fill="none" height="15" viewBox="0 0 24 24" width="15">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE VERIFIED CERTIFICATE VIEW
  // -------------------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
      <TopBar title="Your Certificate" showBack={true} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col justify-between">
        <div>
          {/* Certificate Paper Card — matching website AppStyleCertificateCard exactly */}
          <div
            ref={certRef}
            className="w-full max-w-[420px] mx-auto border-[1.5px] border-[#8C6425] rounded-[18px] p-6 text-center bg-[#FFFDF8] relative shadow-sm select-none overflow-hidden"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 8px, #F6F1E6 8px, #F6F1E6 9px)",
            }}
          >
            {/* Corner Accents */}
            <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-[#8C6425] rounded-tl-sm pointer-events-none" />
            <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-[#8C6425] rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-[#8C6425] rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-[#8C6425] rounded-br-sm pointer-events-none" />

            {/* Top Brand Logo */}
            <div className="flex justify-center mb-3.5">
              <img
                src="/logo_header.png"
                alt="YBB"
                className="h-8 max-w-[130px] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="text-[10px] tracking-[0.18em] text-[#7A7160] uppercase font-mono font-medium">
              Certificate of Completion
            </div>

            <div className="font-serif italic font-semibold text-[23px] text-[#132242] my-3 break-words">
              {learnerName}
            </div>

            <div className="text-[11.5px] text-[#7A7160] leading-[1.55] mb-3">
              has completed the requirements for the
              <br />
              <strong className="text-[#132242] font-bold">
                Authorised Business Broker (ABB)
              </strong>
              <br />
              Certification Programme
            </div>

            {/* Center Gold Brass Seal matching downloaded certificate */}
            <div className="flex items-center justify-center my-3.5 gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#B4863A]/40 max-w-[50px]" />
              <div className="w-10 h-10 rounded-full border-[1.5px] border-[#B4863A] bg-gradient-to-br from-[#FFFDF8] via-[#FAF4E6] to-[#E7CE9C]/40 flex items-center justify-center relative shadow-2xs">
                <div className="absolute inset-0.5 rounded-full border border-dashed border-[#B4863A]/60" />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-[#8C6425]">
                  <path d="M12 2L14.09 8.26L20.18 8.27L15.54 11.97L17.18 18.18L12 14.77L6.82 18.18L8.46 11.97L3.82 8.27L9.91 8.26L12 2Z" fill="currentColor" />
                </svg>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#B4863A]/40 max-w-[50px]" />
            </div>

            <hr className="border-t border-[#E1D8C2] my-3" />

            <div className="flex justify-between items-center text-[10px] text-[#7A7160] px-1">
              <div className="text-left">
                <div className="font-medium">CREDENTIAL ID</div>
                <div className="font-mono text-[#132242] font-bold text-[11px] mt-0.5 whitespace-nowrap">
                  {credId}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">ISSUED</div>
                <div className="font-mono text-[#132242] font-semibold text-[11px] mt-0.5 whitespace-nowrap">
                  {issueDate}
                </div>
              </div>
            </div>
          </div>

          {/* Active Status Badge */}
          <div className="flex justify-center my-4">
            <span className="pill active text-[11px] py-1 px-3 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E4B3E]" />
              <span>Active · Verified</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pb-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="btn btn-brass text-[14px] flex items-center justify-center gap-2"
          >
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>Share Certificate</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn btn-ghost text-[14px] flex items-center justify-center gap-2"
          >
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("verify")}
            className="text-center text-[12px] text-[#8C6425] font-semibold hover:underline mt-2 flex items-center justify-center gap-1"
          >
            <span>View public verification page</span>
            <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
