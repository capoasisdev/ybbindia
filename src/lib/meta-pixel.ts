export const META_PIXEL_ID = "1379767294032071";

const UTM_STORAGE_KEY = "ybb_utm_params";
const UTM_COOKIE_NAME = "ybb_utm_params";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  landing_page?: string;
  captured_at?: string;
};

type FbqFn = {
  (command: "track", eventName: string, params?: Record<string, unknown>, options?: { eventID?: string }): void;
  (command: "init", pixelId: string): void;
};

function getFbq(): FbqFn | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { fbq?: FbqFn };
  return typeof w.fbq === "function" ? w.fbq : null;
}

export function trackPageView() {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("track", "PageView");
}

export function trackViewContent(params: {
  contentName: string;
  value?: number;
  currency?: string;
}) {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("track", "ViewContent", {
    content_name: params.contentName,
    ...(typeof params.value === "number" ? { value: params.value } : {}),
    ...(params.currency ? { currency: params.currency } : {}),
  });
}

export function trackInitiateCheckout(params: {
  value: number;
  currency?: string;
  contentName?: string;
}) {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("track", "InitiateCheckout", {
    value: params.value,
    currency: params.currency || "INR",
    ...(params.contentName ? { content_name: params.contentName } : {}),
  });
}

/**
 * Fires Purchase once per orderId on the client using eventID for CAPI deduplication.
 * Guards against page reloads via localStorage and sessionStorage.
 */
export function trackPurchaseOnce(params: {
  orderId: string;
  value: number;
  currency?: string;
}): boolean {
  if (typeof window === "undefined" || !params.orderId) return false;
  const storageKey = `ybb_fbq_purchase_${params.orderId}`;
  try {
    if (window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey)) {
      return false;
    }
  } catch {
    // Ignore storage read errors in restricted contexts
  }

  const fbq = getFbq();
  if (!fbq) return false;

  fbq(
    "track",
    "Purchase",
    {
      value: params.value,
      currency: params.currency || "INR",
    },
    { eventID: params.orderId },
  );

  try {
    window.localStorage.setItem(storageKey, "1");
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Ignore storage write errors
  }

  return true;
}

export function captureUtmParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const search = new URLSearchParams(window.location.search);
  const incoming: UtmParams = {};
  let hasUtm = false;

  for (const key of UTM_KEYS) {
    const val = search.get(key)?.trim();
    if (val) {
      incoming[key] = val.slice(0, 250);
      hasUtm = true;
    }
  }

  if (!hasUtm) return;

  const existing = getStoredUtmParams() ?? {};
  const merged: UtmParams = {
    ...existing,
    ...incoming,
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  };

  const serialized = JSON.stringify(merged);
  try {
    window.localStorage.setItem(UTM_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage errors
  }
  try {
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `${UTM_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Ignore cookie errors
  }
}

export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UtmParams;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // Fallback to cookie below
  }

  try {
    const match = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${UTM_COOKIE_NAME}=`));
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("="))) as UtmParams;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // Ignore malformed cookie
  }

  return null;
}

