import crypto from "node:crypto";
import { META_PIXEL_ID } from "./meta-pixel";

function sha256(val: string): string {
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export async function sendMetaCapiPurchase(params: {
  orderId: string;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!token) {
    // Awaiting access token from Meta Events Manager
    return { skipped: true, reason: "No META_CAPI_ACCESS_TOKEN configured" };
  }

  const userData: Record<string, unknown> = {};
  if (params.email) {
    userData.em = [sha256(params.email)];
  }
  if (params.phone) {
    const cleaned = params.phone.replace(/\D/g, "");
    if (cleaned) {
      userData.ph = [sha256(cleaned)];
    }
  }
  if (params.ipAddress) {
    userData.client_ip_address = params.ipAddress;
  }
  if (params.userAgent) {
    userData.client_user_agent = params.userAgent;
  }
  if (params.fbc) {
    userData.fbc = params.fbc;
  }
  if (params.fbp) {
    userData.fbp = params.fbp;
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.orderId,
        action_source: "website",
        event_source_url: "https://ybbindia.com/payment-success",
        user_data: userData,
        custom_data: {
          currency: params.currency || "INR",
          value: params.value,
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    return { ok: res.ok, result };
  } catch (err) {
    console.warn("[Meta CAPI] Purchase event dispatch failed:", err);
    return { ok: false, error: String(err) };
  }
}
