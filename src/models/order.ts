import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

export enum OrderStatus {
  Created = "created",
  Paid = "paid",
  Deleted = "deleted",
}

export async function insertOrder(supabase: SupabaseClient, data: OrderInsert) {
  const { data: order, error } = await supabase
    .from("orders")
    .insert(data as never)
    .select()
    .single() as { data: Order | null; error: unknown };

  if (error) {
    console.error("Insert order error:", error);
    return undefined;
  }

  return order;
}

export async function findOrderByOrderNo(
  supabase: SupabaseClient,
  order_no: string
): Promise<Order | undefined> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_no", order_no)
    .limit(1)
    .single() as { data: Order | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Find order by order_no error:", error);
    return undefined;
  }

  return order || undefined;
}

export async function getFirstPaidOrderByUserUuid(
  supabase: SupabaseClient,
  user_uuid: string
): Promise<Order | undefined> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_uuid", user_uuid)
    .eq("status", OrderStatus.Paid)
    .order("created_at", { ascending: true })
    .limit(1)
    .single() as { data: Order | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Get first paid order by user_uuid error:", error);
    return undefined;
  }

  return order || undefined;
}

export async function getFirstPaidOrderByUserEmail(
  supabase: SupabaseClient,
  user_email: string
): Promise<Order | undefined> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_email", user_email)
    .eq("status", OrderStatus.Paid)
    .order("created_at", { ascending: false })
    .limit(1)
    .single() as { data: Order | null; error: unknown };

  if (error) {
    if ((error as any).code === "PGRST116") return undefined; // No rows found
    console.error("Get first paid order by user_email error:", error);
    return undefined;
  }

  return order || undefined;
}

export async function updateOrderStatus(
  supabase: SupabaseClient,
  order_no: string,
  status: string,
  paid_at: string,
  paid_email: string,
  paid_detail: string
) {
  const { data: order, error } = await supabase
    .from("orders")
    .update({ status, paid_at, paid_detail, paid_email } as never)
    .eq("order_no", order_no)
    .select()
    .single() as { data: Order | null; error: unknown };

  if (error) {
    console.error("Update order status error:", error);
    return undefined;
  }

  return order;
}

export async function updateOrderSession(
  supabase: SupabaseClient,
  order_no: string,
  stripe_session_id: string,
  order_detail: string
) {
  const { data: order, error } = await supabase
    .from("orders")
    .update({ stripe_session_id, order_detail } as never)
    .eq("order_no", order_no)
    .select()
    .single() as { data: Order | null; error: unknown };

  if (error) {
    console.error("Update order session error:", error);
    return undefined;
  }

  return order;
}

export async function updateOrderSubscription(
  supabase: SupabaseClient,
  order_no: string,
  sub_id: string,
  sub_interval_count: number,
  sub_cycle_anchor: number,
  sub_period_end: number,
  sub_period_start: number,
  status: string,
  paid_at: string,
  sub_times: number,
  paid_email: string,
  paid_detail: string
) {
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      sub_id,
      sub_interval_count,
      sub_cycle_anchor,
      sub_period_end,
      sub_period_start,
      status,
      paid_at,
      sub_times,
      paid_email,
      paid_detail,
    } as never)
    .eq("order_no", order_no)
    .select()
    .single() as { data: Order | null; error: unknown };

  if (error) {
    console.error("Update order subscription error:", error);
    return undefined;
  }

  return order;
}

export async function getOrdersByUserUuid(
  supabase: SupabaseClient,
  user_uuid: string
): Promise<Order[] | undefined> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_uuid", user_uuid)
    .eq("status", OrderStatus.Paid)
    .order("created_at", { ascending: false }) as { data: Order[] | null; error: unknown };

  if (error) {
    console.error("Get orders by user_uuid error:", error);
    return undefined;
  }

  return data || undefined;
}

export async function getOrdersByUserEmail(
  supabase: SupabaseClient,
  user_email: string
): Promise<Order[] | undefined> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_email", user_email)
    .eq("status", OrderStatus.Paid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get orders by user_email error:", error);
    return undefined;
  }

  return data;
}

export async function getOrdersByPaidEmail(
  supabase: SupabaseClient,
  paid_email: string
): Promise<Order[] | undefined> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("paid_email", paid_email)
    .eq("status", OrderStatus.Paid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get orders by paid_email error:", error);
    return undefined;
  }

  return data;
}

export async function getPaiedOrders(
  supabase: SupabaseClient,
  page: number,
  limit: number
): Promise<Order[] | undefined> {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", OrderStatus.Paid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Get paid orders error:", error);
    return undefined;
  }

  return data;
}

export async function getPaidOrdersTotal(supabase: SupabaseClient): Promise<number | undefined> {
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Get paid orders total error:", error);
    return 0;
  }

  return count || 0;
}

export async function getOrderCountByDate(
  supabase: SupabaseClient,
  startTime: string,
  status?: string
): Promise<Map<string, number> | undefined> {
  const { data, error } = await supabase
    .from("orders")
    .select("created_at")
    .gte("created_at", startTime)
    .order("created_at", { ascending: true }) as { data: { created_at: string | null }[] | null; error: unknown };

  if (error) {
    console.error("Get order count by date error:", error);
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
