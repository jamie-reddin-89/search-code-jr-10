import { useEffect } from "react";
import { trackPageView, trackClick } from "@/lib/analytics";
import { useLocation } from "react-router-dom";
import { logError } from "@/lib/logger";

export default function AnalyticsListener() {
  const location = useLocation();

  useEffect(() => {
    const trackPV = async () => {
      try {
        const path = location.pathname + location.hash;
        await trackPageView(path);
      } catch (error) {
        console.debug("Analytics tracking failed (non-critical):", error);
      }
    };
    trackPV();
  }, [location]);

  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement;
        const btn = target.closest(".nav-button, button, a") as HTMLElement | null;
        if (btn) {
          const label = (btn.getAttribute("aria-label") || btn.textContent || "").trim().slice(0, 100);
          await trackClick(label);
        }
      } catch (error) {
        console.debug("Click tracking failed (non-critical):", error);
      }
    };
    document.addEventListener("click", onClick);
    const onError = (event: ErrorEvent) => {
      try {
        const meta = {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        };
        logError(event.message, event.error, meta);
      } catch (error) {
        console.debug("Error logging failed (non-critical):", error);
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      try {
        logError("Unhandled Promise Rejection", event.reason);
      } catch (error) {
        console.debug("Error logging failed (non-critical):", error);
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
