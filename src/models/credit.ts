import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Credit = Database["public"]["Tables"]["credits"]["Row"];
type CreditInsert = Database["public"]["Tables"]["credits"]["Insert"];

export async function insertCredit(
  supabase: SupabaseClient,
  data: CreditInsert
): Promise<Credit | undefined> {
  const { data: credit, error } = await supabase
    .from("credits")
    .insert(data as never)
    .select()
    .single() as { data: Credit | null; error: unknown };

  if (error) {
    console.error("Insert credit error:", error);
    return undefined;
  }

  return credit || undefined;
}

export async function findCreditByTransNo(
  supabase: SupabaseClient,
  trans_no: string
): Promise<Credit | undefined> {
  const { data: credit, error } = await supabase
    .from("credits")
    .select("*")
    .eq("trans_no", trans_no)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined; // No rows found
    console.error("Find credit by trans_no error:", error);
    return undefined;
  }

  return credit;
}

export async function findCreditByOrderNo(
  supabase: SupabaseClient,
  order_no: string
): Promise<Credit | undefined> {
  const { data: credit, error } = await supabase
    .from("credits")
    .select("*")
    .eq("order_no", order_no)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined; // No rows found
    console.error("Find credit by order_no error:", error);
    return undefined;
  }

  return credit;
}

export async function getUserValidCredits(
  supabase: SupabaseClient,
  user_uuid: string
): Promise<Credit[] | undefined> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_uuid", user_uuid)
    .gte("expired_at", now)
    .order("expired_at", { ascending: true });

  if (error) {
    console.error("Get user valid credits error:", error);
    return undefined;
  }

  return data;
}

export async function getCreditsByUserUuid(
  supabase: SupabaseClient,
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<Credit[] | undefined> {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_uuid", user_uuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Get credits by user_uuid error:", error);
    return undefined;
  }

  return data;
}
