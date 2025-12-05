import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUsersByUuids } from "./user";
import type { User } from "@/types/user";

type Feedback = Database["public"]["Tables"]["feedbacks"]["Row"];
type FeedbackInsert = Database["public"]["Tables"]["feedbacks"]["Insert"];

export async function insertFeedback(
  supabase: SupabaseClient,
  data: FeedbackInsert
): Promise<Feedback | undefined> {
  const { data: feedback, error } = await supabase
    .from("feedbacks")
    .insert(data as never)
    .select()
    .single() as { data: Feedback | null; error: unknown };

  if (error) {
    console.error("Insert feedback error:", error);
    return undefined;
  }

  return feedback || undefined;
}

export async function findFeedbackById(
  supabase: SupabaseClient,
  id: number
): Promise<Feedback | undefined> {
  const { data: feedback, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single() as { data: Feedback | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Find feedback by id error:", error);
    return undefined;
  }

  return feedback || undefined;
}

export async function getFeedbacks(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 50
): Promise<Feedback[] | undefined> {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1) as { data: Feedback[] | null; error: unknown };

  if (error) {
    console.error("Get feedbacks error:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const user_uuids = Array.from(new Set(data.map((item) => item.user_uuid).filter(Boolean)));
  const users = await getUsersByUuids(supabase, user_uuids as string[]);

  return data.map((item) => {
    const user = users?.find((user) => user.uuid === item.user_uuid);
    return { ...item, user };
  }) as (Feedback & { user?: User })[];
}

export async function getFeedbacksTotal(supabase: SupabaseClient): Promise<number | undefined> {
  const { count, error } = await supabase
    .from("feedbacks")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Get feedbacks total error:", error);
    return 0;
  }

  return count || 0;
}
