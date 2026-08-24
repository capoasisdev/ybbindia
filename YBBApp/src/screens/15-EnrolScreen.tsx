import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { loadPublicSettings } from "../lib/api";
import type { PublicPricingSettings } from "../types/app.types";
import confetti from "canvas-confetti";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatINR(amountRupees: number): string {
  if (amountRupees % 1 !== 0) {
    return `₹${amountRupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${amountRupees.toLocaleString("en-IN")}`;
}

export const EnrolScreen: React.FC = () => {
  const { user, enrolCourse, navigateTo, showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(true);

  // Dynamic pricing loaded directly from Supabase settings
  const [pricing, setPricing] = useState<PublicPricingSettings>({
    coursePricePaise: 1500000,
    coursePriceRupees: 15000,
    gstRatePercent: 18,
    gstAmountRupees: 2700,
    totalAmountRupees: 17700,
    totalAmountPaise: 1770000,
    currency: "INR",
    accessDurationDays: 365,
    programmeName: "ABB Certification Programme",
    companyLegalName: "Yoova Business Broking",
    paymentsTestMode: true,
  });
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);

  // Fetch live settings on mount
  useEffect(() => {
    let isMounted = true;
    loadPublicSettings().then((settings) => {
      if (isMounted && settings) {
        setPricing(settings);
        setIsLoadingPricing(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const canProceed = acceptedTerms && acceptedDisclosure && !busy;

  const handleRazorpayPayment = async () => {
    if (!canProceed) {
      showToast("Please accept the terms and disclosure to proceed", "error");
      return;
    }

    setBusy(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error("Razorpay payment gateway could not be loaded. Please check your internet connection.");
      }

      const keyId =
        pricing.razorpayKeyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_live_TRwraDKdx1g9gK";

      const options = {
        key: keyId,
        amount: pricing.totalAmountPaise,
        currency: pricing.currency,
        name: pricing.companyLegalName,
        description: pricing.programmeName,
        image: "https://tusbimtbolvnzlwsjcju.supabase.co/storage/v1/object/public/public_assets/logo.png",
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#132242",
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            showToast("Payment window closed. You can retry whenever you are ready.", "info");
          },
        },
        handler: async (response: any) => {
          try {
            const success = await enrolCourse(undefined, {
              gatewayPaymentId: response.razorpay_payment_id || `rzp_${Date.now()}`,
              gatewayOrderId: response.razorpay_order_id,
              amountPaise: pricing.totalAmountPaise,
              method: "razorpay",
              accessDurationDays: pricing.accessDurationDays,
            });

            if (success) {
              try {
                confetti({
                  particleCount: 90,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ["#B4863A", "#1E4B3E", "#132242", "#E7CE9C"],
                });
              } catch {}
              showToast("🎉 Payment confirmed! You are now enrolled.", "success");
              navigateTo("learn");
            }
          } catch (err: any) {
            showToast(err.message || "Enrolment activation failed", "error");
          } finally {
            setBusy(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      if (typeof rzp.on === "function") {
        rzp.on("payment.failed", (response: any) => {
          setBusy(false);
          const errText =
            response?.error?.description ||
            response?.error?.reason ||
            "Payment failed. Please verify your Razorpay API Key ID in .env.";
          showToast(errText, "error");
        });
      }
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      showToast(
        err.message?.includes("401") || err.message?.includes("Unauthorized")
          ? "Razorpay 401: Invalid Key ID. Please verify your Razorpay Key ID in .env"
          : err.message || "Could not launch Razorpay checkout",
        "error"
      );
      setBusy(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none overflow-hidden relative">
      <TopBar title="Programme Enrolment" showBack={true} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-8">


        {/* What's Included */}
        <div>
          <div className="text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-1">
            What is included
          </div>
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-4 flex flex-col gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#1E4B3E]/15 text-[#1E4B3E] flex items-center justify-center shrink-0 mt-0.5">
                <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[12.5px] text-[#132242] leading-snug">
                <strong className="font-semibold text-[#132242]">11 Masterclass Video Modules:</strong> Complete curriculum on business brokerage, valuations, NDA, IM, and closing.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#1E4B3E]/15 text-[#1E4B3E] flex items-center justify-center shrink-0 mt-0.5">
                <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[12.5px] text-[#132242] leading-snug">
                <strong className="font-semibold text-[#132242]">Practical Workbooks &amp; Case Studies:</strong> Real-world templates, financial models &amp; deal agreements.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#1E4B3E]/15 text-[#1E4B3E] flex items-center justify-center shrink-0 mt-0.5">
                <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[12.5px] text-[#132242] leading-snug">
                <strong className="font-semibold text-[#132242]">Online Qualifying Examination:</strong> 50 randomized scenario MCQs with instant qualification grading.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#1E4B3E]/15 text-[#1E4B3E] flex items-center justify-center shrink-0 mt-0.5">
                <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[12.5px] text-[#132242] leading-snug">
                <strong className="font-semibold text-[#132242]">Verifiable Digital Certificate:</strong> Unique ABB Credential ID with QR code verification.
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary matching Website */}
        <div>
          <div className="text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-1">
            Order Summary &amp; Tax Invoice
          </div>
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-4 flex flex-col gap-2.5 shadow-xs">
            <div className="flex justify-between text-[13px] text-[#7A7160]">
              <span>Programme Fee</span>
              <span className="font-mono text-[#132242] font-semibold">
                {formatINR(pricing.coursePriceRupees)}
              </span>
            </div>
            <div className="flex justify-between text-[13px] text-[#7A7160]">
              <span>GST ({pricing.gstRatePercent}%)</span>
              <span className="font-mono text-[#132242] font-semibold">
                {formatINR(pricing.gstAmountRupees)}
              </span>
            </div>
            <hr className="hair my-0.5" />
            <div className="flex justify-between text-[15px] font-bold text-[#132242]">
              <span>Total Payable</span>
              <span className="font-mono text-[#8C6425] text-[18px]">
                {formatINR(pricing.totalAmountRupees)}
              </span>
            </div>
            <div className="text-[11px] text-[#7A7160] mt-0.5">
              Includes full {pricing.accessDurationDays}-day access, all 11 modules, examination &amp; GST tax invoice.
            </div>
          </div>
        </div>

        {/* Learner Account Info */}
        <div>
          <div className="text-[11px] font-bold text-[#7A7160] tracking-wider uppercase mb-2 px-1">
            Learner Account
          </div>
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[13.5px] font-bold text-[#132242]">
                {user?.name || (user?.email ? user.email.split("@")[0] : "Learner")}
              </div>
              <div className="text-[11.5px] text-[#7A7160]">
                {user?.email || "No email linked"}
              </div>
            </div>
            <span className="pill progress !bg-[#EEE6D3] !text-[#7A7160] text-[10px] font-semibold">
              Ready to Enrol
            </span>
          </div>
        </div>

        {/* Mandatory Policy & Legal Checkboxes */}
        <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-[18px] p-4 flex flex-col gap-3 shadow-xs">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 accent-[#132242] w-4 h-4 rounded"
            />
            <span className="text-[11.5px] text-[#7A7160] leading-snug">
              I agree to the <strong className="text-[#132242]">Terms of Use</strong>, <strong className="text-[#132242]">Privacy Policy</strong>, and <strong className="text-[#132242]">Refund Policy</strong>. I understand that access is activated immediately.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedDisclosure}
              onChange={(e) => setAcceptedDisclosure(e.target.checked)}
              className="mt-0.5 accent-[#132242] w-4 h-4 rounded"
            />
            <span className="text-[11.5px] text-[#7A7160] leading-snug">
              I understand that ABB is a professional certification issued by <strong className="text-[#132242]">{pricing.companyLegalName}</strong>.
            </span>
          </label>
        </div>

        {/* Pay with Razorpay Button */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleRazorpayPayment}
            disabled={!canProceed || isLoadingPricing}
            className="btn btn-primary w-full shadow-lg text-[14.5px] py-3.5 flex items-center justify-center gap-2 rounded-xl"
          >
            {busy ? (
              <span>Opening Razorpay...</span>
            ) : (
              <>
                <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Pay {formatINR(pricing.totalAmountRupees)} via Razorpay</span>
              </>
            )}
          </button>

          <div className="text-center text-[11px] text-[#7A7160] mt-1 flex items-center justify-center gap-1">
            <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Secured by Razorpay · UPI, Cards, NetBanking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
