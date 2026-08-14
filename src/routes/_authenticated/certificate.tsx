import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CheckCircle2, Circle, Download, ShieldAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { getCertificateOverview } from "@/lib/certificate.functions";

export const Route = createFileRoute("/_authenticated/certificate")({
  head: () => ({
    meta: [
      { title: "Certificate | ABB Certification Programme" },
      { name: "description", content: "View and download your ABB certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Gate({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function CornerOrnament({ style }: { style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={44}
      height={44}
      style={style}
    >
      <path d="M4 4 L4 26 M4 4 L26 4" stroke="#CBA959" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 4 L16 16" stroke="#CBA959" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <circle cx="4" cy="4" r="2.5" fill="#CBA959" />
      <circle cx="16" cy="16" r="1.5" fill="#CBA959" opacity="0.4" />
    </svg>
  );
}

type CertData = NonNullable<Awaited<ReturnType<typeof getCertificateOverview>>["certificate"]>;

async function downloadCertificate() {
  const el = document.getElementById("abb-certificate");
  if (!el) return;

  // Read data off the element (set via data-* attributes)
  const name       = el.dataset.name       ?? "";
  const abbId      = el.dataset.abbid      ?? "";
  const issuedOn   = el.dataset.issuedon   ?? "";
  const signatory  = el.dataset.signatory  ?? "Yoova Business Broking";
  const programme  = el.dataset.programme  ?? "ABB Certification Programme";
  const validity   = el.dataset.validity   ?? "";

  // A4 landscape — draw at 2× for retina-quality output
  const LW = 1122, LH = 794;          // logical dimensions (points)
  const SC = 2;                        // pixel scale factor
  const W = LW * SC, H = LH * SC;     // physical canvas pixels
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SC, SC);  // all subsequent coords are in logical (point) space

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, LW, LH);
  bg.addColorStop(0,    "#0c1528");
  bg.addColorStop(0.45, "#162038");
  bg.addColorStop(1,    "#0c1528");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LW, LH);

  const glow = ctx.createRadialGradient(LW/2, LH*0.38, 20, LW/2, LH*0.38, LW*0.52);
  glow.addColorStop(0, "rgba(203,169,89,0.11)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, LW, LH);

  // ── Borders ───────────────────────────────────────────────────────────────
  const M = 22;
  ctx.strokeStyle = "rgba(203,169,89,0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, M, M, LW - M*2, LH - M*2, 12);
  ctx.stroke();

  ctx.strokeStyle = "rgba(203,169,89,0.15)";
  ctx.lineWidth = 1;
  roundRect(ctx, M+14, M+14, LW - (M+14)*2, LH - (M+14)*2, 8);
  ctx.stroke();

  // ── Corner ornaments ──────────────────────────────────────────────────────
  const bx = M+2, by = M+2, bw = LW-M*2-4, bh = LH-M*2-4;
  drawCorner(ctx, bx, by, 0);
  drawCorner(ctx, bx+bw, by, 90);
  drawCorner(ctx, bx, by+bh, -90);
  drawCorner(ctx, bx+bw, by+bh, 180);

  // ── Content — centred vertically ──────────────────────────────────────────
  const cx = LW / 2;
  // Pre-measured content block height → centre it
  const contentH = 56 + 20 + 28 + 22 + 34 + 26 + 28 + 76 + 28 + 24 + 22 + 42 + 60 + 26;
  let y = Math.round((LH - contentH) / 2) + 28; // +28 for seal radius

  // Seal
  const medalGrad = ctx.createRadialGradient(cx, y, 2, cx, y, 30);
  medalGrad.addColorStop(0,   "#f5e27a");
  medalGrad.addColorStop(0.5, "#CBA959");
  medalGrad.addColorStop(1,   "#8a6620");
  ctx.shadowColor = "rgba(203,169,89,0.55)";
  ctx.shadowBlur  = 22;
  ctx.beginPath(); ctx.arc(cx, y, 30, 0, Math.PI*2);
  ctx.fillStyle = medalGrad; ctx.fill();
  ctx.shadowBlur = 0;
  drawStar(ctx, cx, y, 5, 20, 9, "#0c1528");

  // Lines beside seal
  for (const [x1, x2] of [[cx-130, cx-38], [cx+38, cx+130]] as [number, number][]) {
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(x1 < cx ? 0 : 1, "rgba(203,169,89,0)");
    g.addColorStop(x1 < cx ? 1 : 0, "#CBA959");
    ctx.strokeStyle = g; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  }

  y += 48;

  // Organisation
  ctx.fillStyle  = "rgba(203,169,89,0.9)";
  ctx.font       = "bold 13px system-ui, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.textAlign  = "center";
  ctx.fillText("YOOVA BUSINESS BROKING", cx, y); y += 20;

  ctx.fillStyle  = "rgba(148,163,184,0.6)";
  ctx.font       = "11px system-ui, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText(programme.toUpperCase(), cx, y); y += 28;

  goldRule(ctx, cx, y, 110); y += 28;

  // Certify
  ctx.fillStyle = "rgba(148,163,184,0.6)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("THIS IS TO CERTIFY THAT", cx, y); y += 24;

  // Name — large, gold gradient, serif
  ctx.save();
  ctx.font = "bold 64px Georgia, 'Times New Roman', serif";
  ctx.letterSpacing = "0.5px";
  ctx.shadowColor = "rgba(203,169,89,0.4)";
  ctx.shadowBlur  = 22;
  const ng = ctx.createLinearGradient(cx-240, 0, cx+240, 0);
  ng.addColorStop(0,   "#f0dfa8");
  ng.addColorStop(0.45,"#CBA959");
  ng.addColorStop(1,   "#f0dfa8");
  ctx.fillStyle = ng;
  ctx.fillText(name, cx, y + 52);
  ctx.restore();
  y += 82;

  // Body
  ctx.fillStyle = "rgba(148,163,184,0.7)";
  ctx.font = "14px system-ui, sans-serif";
  ctx.letterSpacing = "0.2px";
  ctx.fillText("has successfully completed all coursework, assignments and the final examination,", cx, y); y += 22;
  ctx.fillText("and is hereby recognised as an", cx, y); y += 28;

  ctx.fillStyle = "rgba(203,169,89,0.92)";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("AUTHORISED BUSINESS BROKER", cx, y); y += 38;

  goldRule(ctx, cx, y, 200); y += 42;

  // Meta columns
  const cols: [string, string, number][] = [
    ["ABB ID", abbId, cx - 230],
    ["ISSUED ON", issuedOn, cx],
    ["SIGNATORY", signatory, cx + 230],
  ];
  for (const [label, val, colX] of cols) {
    ctx.fillStyle = "rgba(100,116,139,0.8)";
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText(label, colX, y);

    ctx.strokeStyle = "rgba(203,169,89,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(colX-90, y+7); ctx.lineTo(colX+90, y+7); ctx.stroke();

    ctx.fillStyle = "#d1dce8";
    ctx.font = "13px system-ui, sans-serif";
    ctx.letterSpacing = "0.3px";
    ctx.fillText(val, colX, y + 24);
  }
  y += 50;

  // Validity note
  if (validity) {
    ctx.fillStyle = "rgba(71,85,105,0.75)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.letterSpacing = "0.2px";
    ctx.textAlign = "center";
    ctx.fillText(validity, cx, y);
  }

  // ── Export ───────────────────────────────────────────────────────────────

  const { default: jsPDF } = await import("jspdf");
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [W, H] });
  pdf.addImage(imgData, "PNG", 0, 0, W, H);
  pdf.save("ABB-Certificate.pdf");
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, deg: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.strokeStyle = "rgba(203,169,89,0.6)";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(22, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(12, 12); ctx.stroke();
  ctx.fillStyle = "rgba(203,169,89,0.6)";
  ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, points: number, outer: number, inner: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    i === 0 ? ctx.moveTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle))
             : ctx.lineTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function goldRule(ctx: CanvasRenderingContext2D, cx: number, y: number, halfW: number) {
  const g = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
  g.addColorStop(0, "rgba(203,169,89,0)");
  g.addColorStop(0.5, "#CBA959");
  g.addColorStop(1, "rgba(203,169,89,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx + halfW, y); ctx.stroke();
}


function CertificateCard({ cert, validityNote }: { cert: CertData; validityNote?: string }) {
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      id="abb-certificate"
      data-name={cert.learnerName}
      data-abbid={cert.abbId}
      data-issuedon={issued}
      data-signatory={cert.signatoryName || "Yoova Business Broking"}
      data-programme={cert.programmeName || "ABB Certification Programme"}
      data-validity={validityNote ?? ""}
      style={{
        background: "linear-gradient(145deg, #0f172a 0%, #1a2744 45%, #0f172a 100%)",
        borderRadius: "16px",
        padding: "56px 72px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(203,169,89,0.25)",
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 55% at 50% 25%, rgba(203,169,89,0.10) 0%, transparent 70%)",
      }} />

      {/* Inner gold border */}
      <div style={{
        position: "absolute", inset: "14px", borderRadius: "8px", pointerEvents: "none",
        border: "1px solid rgba(203,169,89,0.22)",
      }} />

      {/* Corner ornaments */}
      <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <CornerOrnament />
      </div>
      <div style={{ position: "absolute", top: "20px", right: "20px", transform: "rotate(90deg)" }}>
        <CornerOrnament />
      </div>
      <div style={{ position: "absolute", bottom: "20px", left: "20px", transform: "rotate(-90deg)" }}>
        <CornerOrnament />
      </div>
      <div style={{ position: "absolute", bottom: "20px", right: "20px", transform: "rotate(180deg)" }}>
        <CornerOrnament />
      </div>

      {/* Content — all inline styles for html2canvas fidelity */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>

        {/* Seal + dividers */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <div style={{ height: "1px", width: "80px", background: "linear-gradient(to right, transparent, #CBA959)" }} />
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "linear-gradient(135deg, #CBA959 0%, #f0d97a 50%, #CBA959 100%)",
            boxShadow: "0 0 24px rgba(203,169,89,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.09 8.26L20.18 8.27L15.54 11.97L17.18 18.18L12 14.77L6.82 18.18L8.46 11.97L3.82 8.27L9.91 8.26L12 2Z" fill="#0f172a" />
            </svg>
          </div>
          <div style={{ height: "1px", width: "80px", background: "linear-gradient(to left, transparent, #CBA959)" }} />
        </div>

        {/* Organisation name */}
        <p style={{
          marginTop: "20px", letterSpacing: "0.35em", fontSize: "10px",
          fontWeight: 700, textTransform: "uppercase", color: "rgba(203,169,89,0.85)",
        }}>
          Yoova Business Broking
        </p>

        {/* Programme name */}
        <p style={{
          marginTop: "4px", letterSpacing: "0.2em", fontSize: "10px",
          textTransform: "uppercase", color: "rgba(148,163,184,0.7)",
        }}>
          {cert.programmeName || "ABB Certification Programme"}
        </p>

        {/* Gold divider */}
        <div style={{
          margin: "22px auto 0", height: "1px", width: "100px",
          background: "linear-gradient(90deg, transparent, #CBA959, transparent)",
        }} />

        {/* Certify text */}
        <p style={{
          marginTop: "24px", fontSize: "11px", letterSpacing: "0.22em",
          textTransform: "uppercase", fontWeight: 600, color: "rgba(226,232,240,0.85)",
        }}>
          THIS ACKNOWLEDGES THAT
        </p>

        {/* Recipient name */}
        <p style={{
          marginTop: "10px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "42px",
          fontWeight: 700,
          letterSpacing: "0.01em",
          color: "#e8d5a3",
          textShadow: "0 2px 20px rgba(203,169,89,0.3)",
          lineHeight: 1.1,
        }}>
          {cert.learnerName}
        </p>

        {/* Requirements statement */}
        <p style={{
          marginTop: "18px", fontSize: "11px", letterSpacing: "0.20em",
          textTransform: "uppercase", fontWeight: 600, color: "rgba(226,232,240,0.85)",
        }}>
          HAS COMPLETED THE REQUIREMENTS FOR
        </p>

        <p style={{
          marginTop: "8px", letterSpacing: "0.08em", fontSize: "16px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 700, textTransform: "uppercase", color: "rgba(240,217,122,0.95)",
        }}>
          {cert.programmeName || "Authorised Business Broker (ABB) Certification Programme"}
        </p>

        {/* Wide gold divider */}
        <div style={{
          margin: "28px auto 0", height: "1px", width: "200px",
          background: "linear-gradient(90deg, transparent, #CBA959, transparent)",
        }} />

        {/* Meta row */}
        <div style={{
          marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "24px", textAlign: "left",
        }}>
          {[
            { label: "ABB ID", value: cert.abbId, mono: true },
            { label: "Issued On", value: issued },
            {
              label: "Signatory",
              value: [cert.signatoryName || "Yoova Business Broking", cert.signatoryTitle]
                .filter(Boolean).join(", "),
            },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <p style={{
                fontSize: "9px", fontWeight: 700, letterSpacing: "0.28em",
                textTransform: "uppercase", color: "rgba(100,116,139,0.8)",
              }}>
                {label}
              </p>
              <div style={{ height: "1px", background: "rgba(203,169,89,0.18)", marginTop: "6px" }} />
              <p style={{
                marginTop: "6px", fontSize: "12px", fontWeight: 500,
                color: "#cbd5e1",
                fontFamily: mono ? "monospace" : "inherit",
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Validity */}
        {validityNote && (
          <p style={{ marginTop: "24px", fontSize: "10px", color: "rgba(71,85,105,0.8)" }}>
            {validityNote}
          </p>
        )}
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

  const cert = data?.certificate ?? null;

  return (
    <AppShell title="Certificate">
      <h1 className="text-3xl font-semibold">Certificate</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Your Authorised Business Broker credential, issued once every programme requirement is met.
      </p>

      {isLoading && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
          Loading your certification status…
        </div>
      )}

      {!isLoading && data && !data.enrolled && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Enroll in the programme to begin working towards your certificate.
        </div>
      )}

      {!isLoading && data?.enrolled && !cert && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-lg font-semibold">Certification checklist</h2>
            <ul className="mt-5 space-y-3">
              <Gate
                done={!!data.eligibility?.lessonsComplete}
                label="Complete every published lesson"
              />
              <Gate
                done={!!data.eligibility?.assignmentsApproved}
                label="Get all compulsory assignments approved"
              />
              <Gate done={!!data.eligibility?.examPassed} label="Pass the final examination" />
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-8">
            {data.awaitingApproval ? (
              <>
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-lg font-semibold">Awaiting approval</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You have met every requirement. Our certification team is reviewing your record
                  and will release your ABB ID shortly.
                </p>
              </>
            ) : (
              <>
                <Award className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-lg font-semibold">Not issued yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Finish the outstanding items on the checklist to unlock your certificate.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {cert && (
        <div className="mt-8 space-y-6">
          {cert.status !== "active" && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              This certificate is currently {cert.status}.
              {cert.statusReason ? ` ${cert.statusReason}` : ""}
            </div>
          )}

          <CertificateCard cert={cert} validityNote={data?.validityNote} />

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={downloadCertificate}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <p className="text-sm text-muted-foreground">
              Anyone can verify this credential at /verify using ABB ID {cert.abbId}.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
