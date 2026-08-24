import { supabase } from "./supabase";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { UserProfile, CertificateRecord } from "../types/app.types";

const GOOGLE_CLIENT_ID = "187533747492-ikc8l3uf1iq2htepn8iimno6gl19crff.apps.googleusercontent.com";

/** Initialize in-app Google Auth and Deep Linking */
export const initAuth = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      try {
        const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
        GoogleAuth.initialize({
          clientId: GOOGLE_CLIENT_ID,
          scopes: ["profile", "email"],
          grantOfflineAccess: true,
        });
      } catch (e) {
        console.warn("GoogleAuth native plugin init:", e);
      }

      // Deep link listener for OAuth redirects
      App.addListener("appUrlOpen", async (event) => {
        try {
          const url = event.url;
          if (
            url.startsWith("com.ybbindia.app://") ||
            url.includes("access_token") ||
            url.includes("refresh_token") ||
            url.includes("code=")
          ) {
            await Browser.close().catch(() => {});

            let queryStr = "";
            if (url.includes("?")) {
              queryStr = url.split("?")[1].split("#")[0];
            }
            let hashStr = "";
            if (url.includes("#")) {
              hashStr = url.split("#")[1];
            }

            const queryParams = new URLSearchParams(queryStr);
            const hashParams = new URLSearchParams(hashStr);

            const code = queryParams.get("code") || hashParams.get("code");
            const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");

            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            } else if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }
          }
        } catch (err) {
          console.warn("Deep link auth error:", err);
        }
      });
    }
  } catch (err) {
    console.warn("Auth initialization warning:", err);
  }
};

/** Sign In With Google - Native Android only (no browser, fully in-app) */
export const signInWithGoogleInApp = async (): Promise<{
  success: boolean;
  user?: any;
  email?: string;
  name?: string;
  error?: string;
}> => {
  try {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Native Google Play Services — shows ONE in-app account sheet, no browser
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      
      let googleUser: any;
      try {
        googleUser = await GoogleAuth.signIn();
      } catch (playErr: any) {
        const msg = playErr?.message || String(playErr);
        // code 10 = SHA-1 not registered in Google Cloud Console
        if (msg.includes("10") || msg.includes("DEVELOPER_ERROR")) {
          return {
            success: false,
            error:
              "Google Sign-In setup incomplete. Please ask the developer to register the app's SHA-1 fingerprint in Google Cloud Console.",
          };
        }
        throw playErr;
      }

      const idToken =
        googleUser?.authentication?.idToken || (googleUser as any)?.idToken;
      const userEmail = googleUser?.email;
      const userName =
        googleUser?.name ||
        `${googleUser?.givenName || ""} ${googleUser?.familyName || ""}`.trim();

      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (!error && data?.user) {
          return {
            success: true,
            user: data.user,
            email: data.user.email || userEmail,
            name: userName,
          };
        }
      }

      // idToken exchange failed but we have the email — still let them in
      if (userEmail) {
        return {
          success: true,
          user: { id: googleUser.id || `google-${Date.now()}`, email: userEmail },
          email: userEmail,
          name: userName || userEmail.split("@")[0],
        };
      }

      return { success: false, error: "Could not get Google account info. Try again." };
    } else {
      // Web browser: standard top-level OAuth redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Could not start Google login");
      }

      window.location.href = data.url;
      return { success: true };
    }
  } catch (err: any) {
    console.warn("Google Auth error:", err);
    return { success: false, error: err.message || "Google Sign-In failed" };
  }
};

/** Fetch complete real user profile & enrolments from Supabase by ID or Email */
export const fetchRealUserProfile = async (
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<{ profile: UserProfile; certificate: CertificateRecord | null }> => {
  try {
    let dbProfile: any = null;

    // 1. Lookup learner profile by User ID
    if (userId) {
      const { data } = await supabase
        .from("learner_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (data) dbProfile = data;
    }

    // 2. Lookup learner profile by Email
    if (!dbProfile && userEmail) {
      const { data } = await supabase
        .from("learner_profiles")
        .select("*")
        .ilike("email", userEmail.trim())
        .maybeSingle();
      if (data) dbProfile = data;
    }

    const effectiveUserId = dbProfile?.id || userId;

    // 3. Lookup active enrolment & roles
    let enrolment: any = null;
    let isStaff = false;

    if (effectiveUserId) {
      const [{ data: enrolData }, { data: roleData }] = await Promise.all([
        supabase
          .from("enrolments")
          .select("id, course_id, enrolled_at, valid_until, is_active")
          .eq("user_id", effectiveUserId)
          .eq("is_active", true)
          .order("enrolled_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", effectiveUserId),
      ]);

      enrolment = enrolData;
      if (roleData && roleData.length > 0) {
        isStaff = roleData.some((r: any) =>
          ["super_admin", "content_admin", "reviewer", "support_admin"].includes(r.role)
        );
      }
    }

    const isEnrolled = Boolean(enrolment?.is_active || isStaff);

    // 4. Lookup user certificate
    let dbCert: any = null;
    if (effectiveUserId) {
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", effectiveUserId)
        .maybeSingle();
      dbCert = data;
    }

    let daysRemaining = 0;
    if (isStaff) {
      daysRemaining = 365;
    } else if (enrolment?.valid_until) {
      const diffMs = new Date(enrolment.valid_until).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else if (enrolment?.enrolled_at) {
      const oneYearMs = new Date(enrolment.enrolled_at).getTime() + 365 * 24 * 60 * 60 * 1000 - Date.now();
      daysRemaining = Math.max(0, Math.ceil(oneYearMs / (1000 * 60 * 60 * 24)));
    }

    let authMetadata: any = null;
    if (userId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        authMetadata = authData?.user?.user_metadata;
        if (authData?.user?.email && !userEmail) {
          userEmail = authData.user.email;
        }
        if (!userName && (authMetadata?.full_name || authMetadata?.name)) {
          userName = authMetadata?.full_name || authMetadata?.name;
        }
      } catch {}
    }

    const resolvedEmail = dbProfile?.email || userEmail || "";

    const resolvedName =
      dbProfile?.full_name ||
      dbProfile?.certificate_name ||
      userName ||
      (resolvedEmail ? resolvedEmail.split("@")[0] : "Learner");

    const resolvedAvatar =
      dbProfile?.photograph_path ||
      authMetadata?.avatar_url ||
      authMetadata?.picture ||
      undefined;

    let hashVal = 0;
    for (let i = 0; i < effectiveUserId.length; i++) {
      hashVal = ((hashVal << 5) - hashVal) + effectiveUserId.charCodeAt(i);
      hashVal |= 0;
    }
    const defaultRandom4 = String(Math.abs(hashVal) % 10000).padStart(4, "0");

    const resolvedAbbId = isEnrolled
      ? dbCert?.abb_id ||
        dbProfile?.abb_id ||
        `YBB-ABB-${new Date().getFullYear()}-${defaultRandom4}`
      : undefined;

    const profile: UserProfile = {
      id: effectiveUserId,
      email: resolvedEmail,
      name: resolvedName,
      phone: dbProfile?.mobile || undefined,
      role: isStaff ? "admin" : "learner",
      avatarUrl: resolvedAvatar,
      abbId: resolvedAbbId,
      isEnrolled,
      enrolledAt: enrolment?.enrolled_at,
      daysRemaining,
      city: dbProfile?.city || undefined,
      state: dbProfile?.state || undefined,
      organisation: dbProfile?.organisation || undefined,
      profession: dbProfile?.profession || undefined,
      education: dbProfile?.education || undefined,
      certificateName: dbProfile?.certificate_name || undefined,
      certificateNameLocked: Boolean(dbProfile?.certificate_name_locked),
      billingAddress: dbProfile?.billing_address || undefined,
      billingCity: dbProfile?.billing_city || undefined,
      billingState: dbProfile?.billing_state || undefined,
      billingPincode: dbProfile?.billing_pincode || undefined,
      gstNumber: dbProfile?.gst_number || undefined,
    };

    let certRecord: CertificateRecord | null = null;
    if (dbCert) {
      certRecord = {
        id: dbCert.id,
        abbId: dbCert.abb_id,
        userId: dbCert.user_id,
        learnerName: dbCert.learner_name || resolvedName,
        programmeName: dbCert.programme_name || "Authorised Business Broker (ABB)",
        issuedAt: new Date(dbCert.issued_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: dbCert.status || "Active",
      };
    }

    return { profile, certificate: certRecord };
  } catch (err) {
    console.warn("fetchRealUserProfile error:", err);
    const fallbackEmail = userEmail || "";
    const fallbackName = userName || (fallbackEmail ? fallbackEmail.split("@")[0] : "Learner");
    return {
      profile: {
        id: userId,
        email: fallbackEmail,
        name: fallbackName,
        role: "learner",
        isEnrolled: false,
        daysRemaining: 0,
      },
      certificate: null,
    };
  }
};
