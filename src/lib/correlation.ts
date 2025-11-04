export function getCorrelationId(): string {
  if (typeof window === "undefined") return "srv";
  const key = "correlation_id";
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      window.sessionStorage.setItem(key, id);
    } catch (_e) {
      // ignore storage errors
    }
  }
  return id;
}

export function getDeviceInfo(): Record<string, any> {
  if (typeof navigator === "undefined") return { env: "server" };
  const nav = navigator as any;
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    vendor: navigator.vendor,
    online: typeof navigator.onLine === "boolean" ? navigator.onLine : undefined,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    screen: typeof window !== "undefined" && window.screen
      ? { width: window.screen.width, height: window.screen.height, pixelRatio: window.devicePixelRatio }
      : undefined,
  };
}
