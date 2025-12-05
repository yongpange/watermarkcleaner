import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Apikey = Database["public"]["Tables"]["apikeys"]["Row"];
type ApikeyInsert = Database["public"]["Tables"]["apikeys"]["Insert"];

export enum ApikeyStatus {
  Created = "created",
  Deleted = "deleted",
}

export async function insertApikey(
  supabase: SupabaseClient,
  data: ApikeyInsert
): Promise<Apikey | undefined> {
  const { data: apikey, error } = await supabase
    .from("apikeys")
    .insert(data as never)
    .select()
    .single() as { data: Apikey | null; error: unknown };

  if (error) {
    console.error("Insert apikey error:", error);
    return undefined;
  }

  return apikey || undefined;
}

export async function getUserApikeys(
  supabase: SupabaseClient,
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<Apikey[] | undefined> {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("apikeys")
    .select("*")
    .eq("user_uuid", user_uuid)
    .neq("status", ApikeyStatus.Deleted)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Get user apikeys error:", error);
    return undefined;
  }

  return data;
}

export async function getUserUuidByApiKey(
  supabase: SupabaseClient,
  apiKey: string
): Promise<string | undefined> {
  const { data: apikey, error } = await supabase
    .from("apikeys")
    .select("*")
    .eq("api_key", apiKey)
    .eq("status", ApikeyStatus.Created)
    .limit(1)
    .single() as { data: Apikey | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Get user_uuid by api_key error:", error);
    return undefined;
  }

  return apikey?.user_uuid;
}
