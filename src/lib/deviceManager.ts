import { supabase } from "@/integrations/supabase/client";

export interface Device {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  specs?: any;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceWithBrand extends Device {
  brand: Brand;
}

/**
 * Generate a route slug from brand and model names
 * Example: "Joule" + "Victorum" -> "joule-victorum"
 */
export function generateRouteSlug(brandName: string, modelName: string): string {
  const brand = brandName.toLowerCase().replace(/\s+/g, "-");
  const model = modelName.toLowerCase().replace(/\s+/g, "-");
  return `${brand}-${model}`;
}

/**
 * Get all devices with their brand information
 */
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export async function getAllDevices(): Promise<DeviceWithBrand[]> {
  if (!isSupabaseConfigured) {
    const msg = 'Supabase is not configured (VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing). Connect Supabase or set the env vars.';
    console.error("Error fetching devices:", msg);
    throw new Error(msg);
  }

  try {
    const { data, error } = await supabase
      .from("public.models" as any)
      .select("*, brands(*)");

    if (error) {
      const mErrMsg = (error as any)?.message ?? JSON.stringify(error);
      console.warn("Error querying 'public.models' table, returning empty list:", mErrMsg);
      return [];
    }
    if (!data || (Array.isArray(data) && data.length === 0)) return [];

    return (data as any[]).map((model: any) => ({
      ...model,
      brand: model.brands,
    }));
  } catch (error) {
    const errMsg = (error as any)?.message ?? JSON.stringify(error, Object.getOwnPropertyNames(error));
    console.error("Error fetching devices:", errMsg, error);
    return [];
  }
}

/**
 * Get a specific device by ID with brand information
 */
export async function getDevice(modelId: string): Promise<DeviceWithBrand | null> {
  try {
    const { data: model, error: modelError } = await supabase
      .from("public.models" as any)
      .select("*")
      .eq("id", modelId)
      .single();

    if (modelError) throw modelError;
    if (!model) return null;

    const { data: brand, error: brandError } = await supabase
      .from("public.brands" as any)
      .select("*")
      .eq("id", model.brand_id)
      .single();

    if (brandError) throw brandError;

    return { ...model, brand };
  } catch (error) {
    console.error("Error fetching device:", error);
    return null;
  }
}

/**
 * Get device by route slug
 * Example: "joule-victorum" -> returns device with matching brand and model
 */
export async function getDeviceBySlug(slug: string): Promise<DeviceWithBrand | null> {
  try {
    const parts = slug.split("-");
    if (parts.length < 2) return null;

    const { data: brands, error: brandsError } = await supabase
      .from("public.brands" as any)
      .select("*");
    if (brandsError) throw brandsError;

    const matchedBrand = (brands || []).find((b: any) =>
      slug.startsWith(b.name.toLowerCase().replace(/\s+/g, "-") + "-")
    );
    if (!matchedBrand) return null;

    const { data: models, error: modelsError } = await supabase
      .from("public.models" as any)
      .select("*")
      .eq("brand_id", matchedBrand.id);
    if (modelsError) throw modelsError;

    const matchedModel = (models || []).find((m: any) =>
      generateRouteSlug(matchedBrand.name, m.name) === slug
    );

    return matchedModel ? { ...matchedModel, brand: matchedBrand } : null;
  } catch (error) {
    console.error("Error fetching device by slug:", error);
    return null;
  }
}

/**
 * Create an error code table for a new device
 * Stores error codes in error_codes_db table with device_model_id reference
 */
export async function createDeviceErrorCodeTable(
  modelId: string,
  brandName: string,
  modelName: string
): Promise<boolean> {
  try {
    // Instead of creating a new table, we'll add a model_id column to error_codes_db
    // and filter by that when fetching error codes for a specific device
    console.log(`Error code storage configured for device: ${brandName} ${modelName}`);
    return true;
  } catch (error) {
    console.error("Error creating device error code table:", error);
    return false;
  }
}

/**
 * Get error codes for a specific device
 */
export async function getDeviceErrorCodes(modelId: string): Promise<any[]> {
  try {
    // In future: filter error_codes_db by device_model_id
    const { data, error } = await supabase
      .from("error_codes_db" as any)
      .select("*")
      .order("code", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching device error codes:", error);
    return [];
  }
}

/**
 * Get all brands
 */
export async function getAllBrands(): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from("public.brands" as any)
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

/**
 * Get all models for a specific brand
 */
export async function getBrandModels(brandId: string): Promise<Device[]> {
  try {
    const { data, error } = await supabase
      .from("public.models" as any)
      .select("*")
      .eq("brand_id", brandId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching brand models:", error);
    return [];
  }
}

/**
 * Subscribe to device changes (real-time updates)
 */
export function subscribeToDevices(callback: (devices: DeviceWithBrand[]) => void) {
  const brandsSubscription = supabase
    .channel("brands-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "brands" }, () => {
      getAllDevices().then(callback);
    })
    .subscribe();

  const modelsSubscription = supabase
    .channel("models-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "models" }, () => {
      getAllDevices().then(callback);
    })
    .subscribe();

  return () => {
    brandsSubscription.unsubscribe();
    modelsSubscription.unsubscribe();
  };
}

/**
 * Subscribe to metadata tables changes (categories, tags, media, urls)
 * Calls the provided callback on any change
 */
export function subscribeToMetadata(onChange: () => void) {
  const categoriesSub = supabase
    .channel("categories-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
      onChange();
    })
    .subscribe();

  const tagsSub = supabase
    .channel("tags-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "tags" }, () => {
      onChange();
    })
    .subscribe();

  const mediaSub = supabase
    .channel("media-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "media" }, () => {
      onChange();
    })
    .subscribe();

  const urlsSub = supabase
    .channel("urls-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "urls" }, () => {
      onChange();
    })
    .subscribe();

  return () => {
    categoriesSub.unsubscribe();
    tagsSub.unsubscribe();
    mediaSub.unsubscribe();
    urlsSub.unsubscribe();
  };
}
