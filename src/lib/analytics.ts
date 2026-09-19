// Google Analytics 4 (gtag.js) helpers.
//
// The measurement ID lives in the runtime secret GOOGLE_ANALYTICS_MEASUREMENT_ID
// and is injected into the SSR HTML head via src/routes/__root.tsx, so gtag.js
// loads on every page. These helpers fire page-view events on client-side
// route changes (TanStack Router is an SPA, so gtag's automatic initial load
// is the only hit it captures on its own).

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Fire a GA4 page_view event for the given path. Safe to call on the server
 * (no-op) and before gtag has loaded (no-op).
 */
export function trackPageView(path: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "page_view", { page_path: path });
  }
}

/**
 * Fire a custom GA4 event, e.g. trackEvent("generate_lead", { method: "form" }).
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params ?? {});
  }
}

export {};
