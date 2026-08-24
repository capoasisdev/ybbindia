import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CheckCircle2, Circle, Download, Share2, ShieldAlert, ExternalLink, Check } from "lucide-react";
import React, { useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { getCertificateOverview } from "@/lib/certificate.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/certificate")({
  head: () => ({
    meta: [
      { title: "Certificate | ABB Certification Programme" },
      { name: "description", content: "View, download and verify your official ABB certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Gate({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-[#1E4B3E] shrink-0" />
      ) : (
        <Circle className="mt-0.5 h-4.5 w-4.5 text-muted-foreground shrink-0" />
      )}
      <span className={done ? "text-foreground font-medium" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

type CertData = NonNullable<Awaited<ReturnType<typeof getCertificateOverview>>["certificate"]>;

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
      // Continue if font load API throws
    }
  }
}

/** Pure Canvas 2D Renderer — produces standard A4 Landscape certificate (297x210mm) at 300-DPI */
async function generateCertificatePdf(
  cert: { abbId: string; learnerName: string; issuedAt: string | Date; programmeName?: string },
  validityNote?: string
) {
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

  // 1. Warm Cream Background (#FFFDF8)
  ctx.fillStyle = "#FFFDF8";
  ctx.fillRect(0, 0, LW, LH);

  // 2. Subtle vertical watermark pinstripes
  ctx.strokeStyle = "rgba(246, 241, 230, 0.75)";
  ctx.lineWidth = 1;
  for (let x = 10; x < LW; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LH);
    ctx.stroke();
  }

  // 3. Ornate Double Borders
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

  // 4. Logo
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

  // 5. Title
  ctx.fillStyle = "#7A7160";
  ctx.font = "bold 13px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("CERTIFICATE OF COMPLETION", cx, 142);

  // 6. Recipient Name
  ctx.fillStyle = "#132242";
  ctx.font = "italic 600 48px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(cert.learnerName, cx, 218);

  // 7. Statement
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

  // 8. Center Brass Seal
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

  // 9. Hairline divider
  ctx.strokeStyle = "#E1D8C2";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 280, 520);
  ctx.lineTo(cx + 280, 520);
  ctx.stroke();

  // 10. Metadata Row (Credential ID & Issued Date)
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Left: Credential ID
  ctx.fillStyle = "#7A7160";
  ctx.font = "bold 11.5px 'Public Sans', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CREDENTIAL ID", cx - 260, 568);

  ctx.fillStyle = "#132242";
  ctx.font = "bold 17px 'IBM Plex Mono', monospace";
  ctx.fillText(cert.abbId, cx - 260, 596);

  // Right: Issued Date
  ctx.fillStyle = "#7A7160";
  ctx.font = "bold 11.5px 'Public Sans', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("ISSUED", cx + 260, 568);

  ctx.fillStyle = "#132242";
  ctx.font = "bold 17px 'IBM Plex Mono', monospace";
  ctx.fillText(issued, cx + 260, 596);

  // 11. Export to jsPDF (A4 Landscape = 297mm x 210mm)
  const { jsPDF } = await import("jspdf");
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`YBB_ABB_Certificate_${cert.abbId}.pdf`);
}

function AppStyleCertificateCard({
  cert,
  validityNote,
}: {
  cert: CertData;
  validityNote?: string;
}) {
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="w-full flex flex-col items-center">
      {/* Certificate Paper Container — max-w-[420px] matching app exactly */}
      <div
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
            alt="Yoova Business Broking"
            className="h-8 max-w-[130px] object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Certificate Title */}
        <div className="text-[10px] tracking-[0.18em] text-[#7A7160] uppercase font-mono font-medium">
          Certificate of Completion
        </div>

        {/* Recipient Learner Name */}
        <div className="font-serif italic font-semibold text-[23px] text-[#132242] my-3 break-words">
          {cert.learnerName}
        </div>

        {/* Description */}
        <div className="text-[11.5px] text-[#7A7160] leading-[1.55] mb-3">
          has completed the requirements for the
          <br />
          <strong className="text-[#132242] font-bold">
            {cert.programmeName || "Authorised Business Broker (ABB)"}
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

        {/* Hairline Divider */}
        <hr className="border-t border-[#E1D8C2] my-3" />

        {/* Metadata Details Row */}
        <div className="flex justify-between items-center text-[10px] text-[#7A7160] px-1">
          <div className="text-left">
            <div className="font-medium">CREDENTIAL ID</div>
            <div className="font-mono text-[#132242] font-bold text-[11px] mt-0.5 whitespace-nowrap">
              {cert.abbId}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">ISSUED</div>
            <div className="font-mono text-[#132242] font-semibold text-[11px] mt-0.5 whitespace-nowrap">
              {issued}
            </div>
          </div>
        </div>

        {validityNote && (
          <div className="text-[10px] text-[#7A7160] mt-3">
            {validityNote}
          </div>
        )}
      </div>

      {/* Active Status Badge */}
      <div className="flex justify-center my-4">
        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#1E4B3E]/10 border border-[#1E4B3E]/30 text-[#1E4B3E] text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E4B3E]" />
          <span>Active · Verified</span>
        </span>
      </div>
    </div>
  );
}

function Page() {
  const fetchOverview = useServerFn(getCertificateOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["certificate-overview"],
    queryFn: () => fetchOverview(),
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const cert = data?.certificate ?? null;

  const handleDownloadPdf = async () => {
    if (!cert) return;
    setIsDownloading(true);
    toast.info("Generating high-resolution certificate PDF…");

    try {
      await generateCertificatePdf(cert, data?.validityNote);
      toast.success("Certificate PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Could not generate certificate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cert) return;
    const verifyUrl = `${window.location.origin}/verify?abbId=${cert.abbId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Authorised Business Broker (ABB) Certificate",
          text: `I have earned my official Authorised Business Broker (ABB) Certification from Yoova Business Broking! Credential ID: ${cert.abbId}`,
          url: verifyUrl,
        });
        toast.success("Certificate shared!");
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast.success("Verification link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info(`Credential verification link: ${verifyUrl}`);
    }
  };

  return (
    <AppShell title="Certificate">
      <div className="max-w-4xl mx-auto pb-12">
        <h1 className="text-3xl font-serif font-bold text-[#132242]">Your Official Certificate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authorised Business Broker (ABB) credential issued upon complete curriculum mastery and examination qualification.
        </p>

        {isLoading && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground text-center">
            Loading your certification status…
          </div>
        )}

        {!isLoading && data && !data.enrolled && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            <Award className="h-10 w-10 text-[#8C6425] mx-auto mb-3 opacity-60" />
            <p className="font-semibold text-foreground text-base mb-1">Programme Enrolment Required</p>
            <p>Enrol in the ABB Certification Programme to begin earning your official credentials.</p>
          </div>
        )}

        {!isLoading && data?.enrolled && !cert && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-[#E1D8C2] bg-[#FFFDF8] p-8 shadow-xs">
              <h2 className="font-serif text-lg font-bold text-[#132242]">Certification Checklist</h2>
              <ul className="mt-5 space-y-3.5">
                <Gate
                  done={!!data.eligibility?.lessonsComplete}
                  label="Complete every published lesson in the curriculum"
                />
                <Gate
                  done={!!data.eligibility?.assignmentsApproved}
                  label="Submit and receive faculty approval on practical assignments"
                />
                <Gate
                  done={!!data.eligibility?.examPassed}
                  label="Pass the 50-question qualifying examination (70%+)"
                />
              </ul>
            </div>
            <div className="rounded-2xl border border-[#E1D8C2] bg-[#F6F1E6] p-8 flex flex-col justify-center">
              {data.awaitingApproval ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-[#1E4B3E]/15 text-[#1E4B3E] flex items-center justify-center mb-3">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#132242]">Awaiting Faculty Release</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    You have met every qualification requirement. Our certification committee is verifying your record and your digital certificate will appear here immediately.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-[#B4863A]/15 text-[#8C6425] flex items-center justify-center mb-3">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#132242]">Not Issued Yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Complete the remaining requirements on the checklist to unlock your verified ABB ID and downloadable certificate.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {cert && (
          <div className="mt-8 space-y-6">
            {cert.status !== "active" && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive font-medium">
                This certificate is currently {cert.status}.
                {cert.statusReason ? ` ${cert.statusReason}` : ""}
              </div>
            )}

            {/* App-Matched Signature Certificate View */}
            <AppStyleCertificateCard
              cert={cert}
              validityNote={data?.validityNote}
            />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="bg-[#132242] hover:bg-[#1F3363] text-[#FFFDF8] font-bold px-5 py-2.5 rounded-xl shadow-sm gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#E7CE9C]" />
                <span>{isDownloading ? "Generating PDF…" : "Download Certificate PDF"}</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                className="border-[#E1D8C2] bg-[#FFFDF8] hover:bg-[#F6F1E6] text-[#132242] font-semibold px-5 py-2.5 rounded-xl gap-2 cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4 text-[#8C6425]" />}
                <span>{copied ? "Link Copied!" : "Share Certificate"}</span>
              </Button>

              <a
                href={`/verify?abbId=${cert.abbId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6425] hover:text-[#B4863A] hover:underline px-3 py-2"
              >
                <span>Public Verification Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
