import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui/TopBar";
import { supabase } from "../lib/supabase";

export const OtpVerifyScreen: React.FC = () => {
  const { navigateTo, showToast, refreshUserData } = useApp();
  const [phone, setPhone] = useState("+91");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"enter_phone" | "enter_otp">("enter_phone");
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0 || step !== "enter_otp") return;
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (error) {
        showToast(error.message, "error");
      } else {
        setStep("enter_otp");
        setTimer(30);
        showToast("OTP sent to " + phone, "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      showToast("Please enter all 6 digits", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: code,
        type: "sms",
      });

      if (error) {
        showToast(error.message, "error");
      } else if (data.session) {
        if (data.user) {
          const userId = data.user.id;
          const userEmail = data.user.email || "";
          const userName = data.user.user_metadata?.full_name || phone.trim();
          await refreshUserData(userId, userEmail, userName);
        }
        showToast("Phone verified successfully!", "success");
        navigateTo("home");
      }
    } catch (err: any) {
      showToast(err.message || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    try {
      await supabase.auth.signInWithOtp({ phone: phone.trim() });
      showToast("New OTP sent to " + phone, "info");
    } catch {
      showToast("Could not resend OTP", "error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none justify-between">
      <TopBar title="Verify Phone Number" showBack={true} />

      <div className="flex-1 p-6 flex flex-col justify-between">
        {step === "enter_phone" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 pt-4">
            <p className="text-[14px] text-[#7A7160] leading-[1.6]">
              Enter your mobile number with country code to receive a 6‑digit verification code.
            </p>

            <div className="field">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="val font-mono bg-transparent outline-none text-[16px] text-[#132242] font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-3"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-[14px] text-[#7A7160] leading-[1.6] mb-7">
              We've sent a 6‑digit code to{" "}
              <strong className="text-[#132242] font-semibold">{phone}</strong>
            </p>

            {/* 6 OTP Boxes */}
            <div className="flex gap-2 justify-between mb-6">
              {digits.map((digit, idx) => {
                const isFilled = Boolean(digit);
                return (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-[46px] h-[54px] rounded-[12px] text-center font-mono text-[20px] font-semibold bg-[#FFFDF8] border transition-all outline-none ${
                      isFilled
                        ? "border-[#8C6425] text-[#132242] shadow-xs"
                        : "border-[#E1D8C2] text-[#132242]"
                    } focus:border-[#B4863A] focus:ring-2 focus:ring-[#B4863A]/20`}
                  />
                );
              })}
            </div>

            {/* Resend Countdown */}
            <div className="text-[13px] text-[#7A7160] mb-8 flex items-center justify-between">
              {timer > 0 ? (
                <span>
                  Resend code in{" "}
                  <span className="font-mono text-[#132242] font-semibold">
                    00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#8C6425] font-semibold hover:underline"
                >
                  Resend OTP now
                </button>
              )}

              <button
                type="button"
                onClick={() => setStep("enter_phone")}
                className="text-[12px] text-[#7A7160] hover:underline"
              >
                Change number
              </button>
            </div>
          </div>
        )}

        {step === "enter_otp" && (
          <div className="pb-4">
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
