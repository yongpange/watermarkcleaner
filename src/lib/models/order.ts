/**
 * Order Model
 * Handles all database operations for orders
 */

import { supabase } from '@/lib/supabase-client';
import { generateSnowId } from '@/lib/utils';
import type { PaymentStatus, PaymentType } from '@/extensions/payment/types';

// ==========================================================================
// Types
// ==========================================================================

export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  user_email?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  payment_amount?: number | null;
  payment_currency?: string | null;
  payment_type?: PaymentType | null;
  payment_interval?: string | null;
  payment_provider: string;
  payment_session_id?: string | null;

  checkout_info: string;
  checkout_result?: string | null;
  payment_result?: string | null;
  payment_email?: string | null;
  transaction_id?: string | null;
  subscription_id?: string | null;
  subscription_result?: string | null;
  discount_code?: string | null;
  discount_amount?: number | null;
  discount_currency?: string | null;
  credits_amount?: number | null;
  credits_valid_days?: number | null;
  product_id?: string | null;
  product_name?: string | null;
  plan_name?: string | null;
  description?: string | null;
  invoice_id?: string | null;
  invoice_url?: string | null;
  paid_at?: string | null;
  checkout_url?: string | null;
  callback_url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// ==========================================================================
// CRUD Operations
// ==========================================================================

/**
 * Create a new order
 */
export async function createOrder(newOrder: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<Order> {
  const orderNo = `ORD-${generateSnowId()}`;

  const { data, error } = await supabase
    .from('wmc_order' as any)
    .insert([{
      ...newOrder,
      order_no: orderNo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return data as unknown as Order;
}

/**
 * Find order by order number
 */
export async function findOrderByOrderNo(orderNo: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('wmc_order' as any)
    .select('*')
    .eq('order_no', orderNo)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to find order: ${error.message}`);
  }

  return data as unknown as Order | null;
}

/**
 * Find order by transaction ID
 */
export async function findOrderByTransactionId({
  transactionId,
  paymentProvider,
}: {
  transactionId?: string;
  paymentProvider: string;
}): Promise<Order | null> {
  if (!transactionId) {
    return null;
  }

  const { data, error } = await supabase
    .from('wmc_order' as any)
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('payment_provider', paymentProvider)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find order by transaction: ${error.message}`);
  }

  return data as unknown as Order | null;
}

/**
 * Update order by order number
 */
export async function updateOrderByOrderNo(
  orderNo: string,
  updates: Partial<Omit<Order, 'id' | 'order_no' | 'created_at'>>
): Promise<Order> {
  const { data, error } = await supabase
    .from('wmc_order' as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('order_no', orderNo)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return data as unknown as Order;
}

/**
 * Update order within a database transaction (using RPC)
 */
export async function updateOrderInTransaction(
  orderNo: string,
  updates: Partial<Omit<Order, 'id' | 'order_no' | 'created_at'>>
): Promise<Order> {
  // Use Supabase RPC for transaction-like behavior
  const { data, error } = await supabase.rpc('update_order' as any, {
    p_order_no: orderNo,
    p_updates: {
      ...updates,
      updated_at: new Date().toISOString(),
    },
  });

  if (error) {
    throw new Error(`Failed to update order in transaction: ${error.message}`);
  }

  return data as unknown as Order;
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId({
  userId,
  status,
  paymentType,
  limit = 20,
  offset = 0,
}: {
  userId: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
  let query = supabase
    .from('wmc_order' as any)
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (paymentType) {
    query = query.eq('payment_type', paymentType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get orders: ${error.message}`);
  }

  return (data as unknown as Order[]) || [];
}

/**
 * Get order statistics for user
 */
export async function getOrderStats(userId: string): Promise<{
  totalOrders: number;
  paidOrders: number;
  failedOrders: number;
  totalAmount: number;
}> {
  const { data, error } = await supabase.rpc('get_order_stats' as any, { p_user_id: userId });

  if (error) {
    throw new Error(`Failed to get order stats: ${error.message}`);
  }

  return data || {
    totalOrders: 0,
    paidOrders: 0,
    failedOrders: 0,
    totalAmount: 0,
  };
}

/**
 * Soft delete an order
 */
export async function deleteOrder(orderNo: string): Promise<void> {
  const { error } = await supabase
    .from('wmc_order' as any)
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_no', orderNo);

  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
}

/**
 * Check if order exists and is paid (idempotency)
 */
export async function isOrderPaid(orderNo: string): Promise<boolean> {
  const order = await findOrderByOrderNo(orderNo);
  return order?.status === 'paid';
}

/**
 * Generate unique order number
 */
function _generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// ==========================================================================
// Database Functions (RPC wrappers)
// ==========================================================================

/**
 * Create database functions for complex operations
 */
export async function createOrderDatabaseFunctions(): Promise<void> {
  // update_order function
  const { error: error1 } = await supabase.rpc('exec_sql' as any, {
    sql: `
      CREATE OR REPLACE FUNCTION update_order(p_order_no TEXT, p_updates JSONB)
      RETURNS wmc_order AS $$
      DECLARE
        v_order wmc_order;
      BEGIN
        UPDATE wmc_order
        SET
          status = COALESCE(p_updates->>'status', status),
          payment_amount = COALESCE((p_updates->>'payment_amount')::INTEGER, payment_amount),
          payment_currency = COALESCE(p_updates->>'payment_currency', payment_currency),
          payment_result = COALESCE(p_updates->>'payment_result', payment_result),
          transaction_id = COALESCE(p_updates->>'transaction_id', transaction_id),
          subscription_id = COALESCE(p_updates->>'subscription_id', subscription_id),
          subscription_result = COALESCE(p_updates->>'subscription_result', subscription_result),
          paid_at = COALESCE((p_updates->>'paid_at')::TIMESTAMPTZ, paid_at),
          invoice_id = COALESCE(p_updates->>'invoice_id', invoice_id),
          invoice_url = COALESCE(p_updates->>'invoice_url', invoice_url),
          updated_at = NOW()
        WHERE order_no = p_order_no
        RETURNING * INTO v_order;

        RETURN v_order;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error1) {
    console.error('Failed to create update_order function:', error1);
  }

  // get_order_stats function
  const { error: error2 } = await supabase.rpc('exec_sql' as any, {
    sql: `
      CREATE OR REPLACE FUNCTION get_order_stats(p_user_id TEXT)
      RETURNS JSONB AS $$
      DECLARE
        result JSONB;
      BEGIN
        SELECT jsonb_build_object(
          'total_orders', COUNT(*),
          'paid_orders', COUNT(*) FILTER (WHERE status = 'paid'),
          'failed_orders', COUNT(*) FILTER (WHERE status = 'failed'),
          'total_amount', COALESCE(SUM(payment_amount), 0)
        )
        INTO result
        FROM wmc_order
        WHERE user_id = p_user_id
          AND deleted_at IS NULL;

        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error2) {
    console.error('Failed to create get_order_stats function:', error2);
  }
}

const orderModel = {
  createOrder,
  findOrderByOrderNo,
  findOrderByTransactionId,
  updateOrderByOrderNo,
  updateOrderInTransaction,
  getOrdersByUserId,
  getOrderStats,
  deleteOrder,
  isOrderPaid,
  createOrderDatabaseFunctions,
};

export default orderModel;