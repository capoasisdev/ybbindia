import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { TabBar } from "../components/ui/TabBar";
import { verifyCertificateViaSupabase } from "../lib/api";

export const VerifyScreen: React.FC = () => {
  const { showToast, navigateTo } = useApp();
  const [abbId, setAbbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    found: boolean;
    name?: string;
    programme?: string;
    issued?: string;
    status?: string;
    abbId?: string;
  } | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!abbId.trim()) {
      showToast("Please enter an ABB Credential ID to verify", "error");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    const result = await verifyCertificateViaSupabase(abbId.trim());

    if (result.found) {
      setVerifiedResult({
        found: true,
        abbId: result.abbId || abbId.trim().toUpperCase(),
        name: result.learnerName,
        programme: result.programmeName,
        issued: result.issuedAt,
        status: result.status || "Active",
      });
      showToast("Official credential verified!", "success");
    } else {
      setVerifiedResult({
        found: false,
        abbId: abbId.trim().toUpperCase(),
      });
      showToast("No official certificate matches this ID", "error");
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between overflow-hidden">
      <TopBar title="Verify Credential" />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        <p className="text-[13px] text-[#7A7160] leading-[1.6]">
          Enter an Authorised Business Broker (ABB) credential ID to confirm authentic certification issued by Yoova Business Broking.
        </p>

        {/* Search Field & Submit */}
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <div className="field">
            <label>ABB Credential ID</label>
            <input
              type="text"
              value={abbId}
              onChange={(e) => setAbbId(e.target.value.toUpperCase())}
              placeholder="e.g. YBB-ABB-2026-XXXX"
              className="val font-mono bg-transparent outline-none text-[15px] text-[#132242] font-bold tracking-wider uppercase"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full text-[14px]"
          >
            {loading ? "Verifying with Registry..." : "Verify Credential"}
          </button>
        </form>

        {/* Live Result Card - Shown ONLY after user submits a search */}
        {hasSearched && verifiedResult && (
          <div
            className={`border-[1.5px] rounded-[20px] p-5 transition-all shadow-sm mt-2 ${
              verifiedResult.found
                ? "border-[#1E4B3E]/30 bg-[#E4EEE8] text-[#1E4B3E]"
                : "border-[#9A4230]/30 bg-[#F3E1DB] text-[#9A4230]"
            }`}
          >
            {/* Status Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-current/15">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ${
                  verifiedResult.found ? "bg-[#1E4B3E]" : "bg-[#9A4230]"
                }`}
              >
                {verifiedResult.found ? (
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="#fff"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.6"
                    />
                  </svg>
                ) : (
                  <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-[14px] font-bold leading-tight">
                  {verifiedResult.found
                    ? "Official Certificate Verified"
                    : "Invalid / Credential Not Found"}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {verifiedResult.found
                    ? "Issued by Yoova Business Broking Pvt Ltd"
                    : `No record found for ID: ${verifiedResult.abbId}`}
                </div>
              </div>
            </div>

            {/* Verified Details Grid */}
            {verifiedResult.found && (
              <div className="flex flex-col gap-2.5 text-[12.5px] text-[#132242]">
                <div className="flex justify-between items-baseline py-1 border-b border-black/5">
                  <span className="text-[#7A7160] text-[11.5px] font-medium">Learner Name</span>
                  <span className="font-serif font-bold text-[14px] text-[#132242]">
                    {verifiedResult.name}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5">
                  <span className="text-[#7A7160] text-[11.5px] font-medium">Programme</span>
                  <span className="font-semibold text-[12.5px] text-[#132242] text-right">
                    {verifiedResult.programme}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5">
                  <span className="text-[#7A7160] text-[11.5px] font-medium">Credential ID</span>
                  <span className="font-mono font-bold text-[12.5px] text-[#8C6425]">
                    {verifiedResult.abbId}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5">
                  <span className="text-[#7A7160] text-[11.5px] font-medium">Issue Date</span>
                  <span className="font-mono text-[12px] text-[#132242]">
                    {verifiedResult.issued}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#7A7160] text-[11.5px] font-medium">Status</span>
                  <span className="pill active !bg-[#1E4B3E] !text-white text-[10.5px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>{verifiedResult.status}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("certificate")}
                  className="btn btn-ghost mt-3 text-[13px] bg-[#FFFDF8] !border-[#1E4B3E]/30 text-[#1E4B3E] flex items-center justify-center gap-1.5"
                >
                  <span>View Full Certificate</span>
                  <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Docked TabBar at Bottom */}
      <TabBar />
    </div>
  );
};
