import { supabase } from "@/integrations/supabase/client";
import { trackSearch as trackAnalyticsSearch } from "@/lib/analytics";

export const useAnalytics = () => {
  const trackSearch = async (systemName: string, errorCode: string, userId?: string) => {
    try {
      await (supabase as any).from("search_analytics" as any).insert({
        system_name: systemName,
        error_code: errorCode,
        user_id: userId || null,
      });
    } catch (error) {
      console.debug("Search analytics tracking failed (non-critical):", error);
    }
    try {
      await trackAnalyticsSearch(errorCode, systemName);
    } catch (error) {
      console.debug("Event tracking failed (non-critical):", error);
    }
  };

  return { trackSearch };
};
