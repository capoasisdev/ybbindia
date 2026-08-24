import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Seal } from "../components/ui/Seal";
import { supabase } from "../lib/supabase";
import { signInWithGoogleInApp } from "../lib/auth";

export const SignInScreen: React.FC = () => {
  const { navigateTo, showToast, refreshUserData } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast("Please enter email and password", "error");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const trimmedName = name.trim() || trimmedEmail.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: { full_name: trimmedName },
          },
        });

        if (error) {
          showToast(
            error.message.toLowerCase().includes("already")
              ? "Account already exists with this email. Please sign in."
              : error.message,
            "error"
          );
        } else if (data.user) {
          const userId = data.user.id;
          const userEmail = data.user.email || trimmedEmail;
          const userName = data.user.user_metadata?.full_name || trimmedName;

          // If session is not immediately returned, sign in to establish auth session
          if (!data.session) {
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password: password,
            });

            if (signInErr) {
              if (signInErr.message.toLowerCase().includes("confirm")) {
                showToast("Account created! Please check your email to confirm your account.", "info");
                setIsSignUp(false);
                return;
              }
            } else if (signInData?.user) {
              await refreshUserData(
                signInData.user.id,
                signInData.user.email || userEmail,
                signInData.user.user_metadata?.full_name || userName
              );
              showToast(`Account created successfully! Welcome ${userName}.`, "success");
              navigateTo("home");
              return;
            }
          }

          // Immediately populate AppContext with the new user's real email & name
          await refreshUserData(userId, userEmail, userName);
          showToast(`Account created successfully! Welcome ${userName}.`, "success");
          navigateTo("home");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (error) {
          showToast(
            error.message === "Invalid login credentials"
              ? "Incorrect email or password. Please try again."
              : error.message,
            "error"
          );
        } else if (data?.user) {
          const userId = data.user.id;
          const userEmail = data.user.email || trimmedEmail;
          const userName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            userEmail.split("@")[0];

          await refreshUserData(userId, userEmail, userName);
          showToast("Signed in successfully!", "success");
          navigateTo("home");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Authentication error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogleInApp();
      if (!res.success && res.error) {
        showToast(res.error, "error");
        setGoogleLoading(false);
      }
      // If success=true with no user, the in-app browser opened.
      // The deep link listener in AppContext will handle navigation automatically.
      // Don't navigate or show toast here — wait for onAuthStateChange.
      if (res.success && res.user) {
        // Direct sign-in (web flow) — navigate immediately
        await refreshUserData(res.user?.id, res.email, res.name);
        showToast("Signed in with Google successfully!", "success");
        navigateTo("home");
        setGoogleLoading(false);
      }
    } catch (err: any) {
      showToast(err.message || "Google sign-in error", "error");
      setGoogleLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Please enter your registered email", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast(`Password recovery link sent to ${forgotEmail}`, "success");
        setShowForgotModal(false);
      }
    } catch {
      showToast("Could not send recovery link", "error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F1E6] text-[#132242] select-none overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-5 safe-top pb-8">
        {/* Brand Logo */}
        <div className="mb-6 pt-3">
          <img
            src="/logo_header.png"
            alt="YBB - Yoova Business Broking"
            className="h-10 max-w-[180px] object-contain"
          />
        </div>

        {/* Heading */}
        <h1 className="font-serif font-semibold text-[26px] mb-2 leading-tight text-[#132242]">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-[13.5px] text-[#7A7160] mb-6">
          {isSignUp
            ? "Enrol in the ABB Certification Programme."
            : "Sign in with your YBB account to access your course."}
        </p>

        {/* In-App Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          className="btn btn-ghost w-full flex items-center justify-center gap-2.5 bg-[#FFFDF8] border-[#E1D8C2] shadow-xs mb-4 hover:border-[#B4863A] active:scale-[0.99] transition-all"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-[14px] font-semibold text-[#132242]">
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2.5 my-4">
          <hr className="hair flex-1" />
          <span className="text-[11px] text-[#7A7160] uppercase tracking-wider font-semibold">
            or sign in with password
          </span>
          <hr className="hair flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isSignUp && (
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="val bg-transparent outline-none text-[14px] text-[#132242]"
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="val bg-transparent outline-none text-[14px] text-[#132242]"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="val bg-transparent outline-none text-[14px] text-[#132242]"
              required
            />
          </div>

          {!isSignUp && (
            <div className="flex justify-end my-1">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-[12.5px] text-[#8C6425] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="btn btn-primary mt-2"
          >
            {loading ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigateTo("otp-verify")}
          className="btn btn-ghost w-full mt-3 text-[13.5px]"
        >
          Sign In with Phone OTP
        </button>

        {/* Toggle sign in / sign up */}
        <p className="text-center text-[13px] text-[#7A7160] mt-7">
          {isSignUp ? "Already have an account? " : "New to YBB? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#132242] font-bold hover:underline"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-5">
          <div className="bg-[#FFFDF8] border border-[#E1D8C2] rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <h3 className="font-serif font-semibold text-[17px] mb-2 text-[#132242]">
              Reset Password
            </h3>
            <p className="text-[12px] text-[#7A7160] mb-4">
              Enter your email address and we'll send you a password recovery link.
            </p>
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="val bg-transparent outline-none text-[13.5px]"
                  placeholder="name@email.com"
                  required
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn btn-ghost flex-1 text-[13px]"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 text-[13px]">
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
