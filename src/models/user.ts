import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

export async function insertUser(
  supabase: SupabaseClient,
  data: UserInsert
): Promise<User | undefined> {
  const { data: user, error } = await supabase
    .from("users")
    .insert(data as never)
    .select()
    .single() as { data: User | null; error: unknown };

  if (error) {
    console.error("Insert user error:", error);
    return undefined;
  }

  return user || undefined;
}

export async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | undefined> {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .limit(1)
    .single() as { data: User | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Find user by email error:", error);
    return undefined;
  }

  return user || undefined;
}

export async function findUserByUuid(
  supabase: SupabaseClient,
  uuid: string
): Promise<User | undefined> {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single() as { data: User | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Find user by uuid error:", error);
    return undefined;
  }

  return user || undefined;
}

export async function getUsers(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 50
): Promise<User[] | undefined> {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1) as { data: User[] | null; error: unknown };

  if (error) {
    console.error("Get users error:", error);
    return undefined;
  }

  return data || undefined;
}


export async function getUsersByUuids(
  supabase: SupabaseClient,
  user_uuids: string[]
): Promise<User[] | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("uuid", user_uuids) as { data: User[] | null; error: unknown };

  if (error) {
    console.error("Get users by uuids error:", error);
    return undefined;
  }

  return data || undefined;
}

export async function getUsersTotal(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Get users total error:", error);
    return 0;
  }

  return count || 0;
}

export async function getUserCountByDate(
  supabase: SupabaseClient,
  startTime: string
): Promise<Map<string, number> | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", startTime)
    .order("created_at", { ascending: true }) as { data: { created_at: string | null }[] | null; error: unknown };

  if (error) {
    console.error("Get user count by date error:", error);
    return undefined;
  }

  const dateCountMap = new Map<string, number>();
  data?.forEach((item) => {
    if (item.created_at) {
      const date = item.created_at.split("T")[0];
      dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
    }
  });

  return dateCountMap;
}
