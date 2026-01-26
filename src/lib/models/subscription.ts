/**
 * Subscription Model
 * Handles all database operations for subscriptions
 */

import { supabase } from '@/lib/supabase-client';
import { generateSnowId } from '@/lib/utils';
import type { SubscriptionStatus } from '@/extensions/payment/types';

// ==========================================================================
// Types
// ==========================================================================

export interface Subscription {
  id: string;
  subscription_no: string;
  user_id: string;
  user_email?: string | null;
  status: SubscriptionStatus;
  payment_provider: string;
  subscription_id: string;
  subscription_result?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  payment_product_id?: string | null;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  interval?: string | null;
  interval_count?: number | null;
  trial_period_days?: number | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  plan_name?: string | null;
  billing_url?: string | null;
  credits_amount?: number | null;
  credits_valid_days?: number | null;
  payment_user_id?: string | null;
  canceled_at?: string | null;
  canceled_end_at?: string | null;
  canceled_reason?: string | null;
  canceled_reason_type?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// ==========================================================================
// CRUD Operations
// ==========================================================================

/**
 * Create a new subscription
 */
export async function createSubscription(
  newSubscription: Omit<Subscription, 'id' | 'subscription_no' | 'created_at' | 'updated_at'>
): Promise<Subscription> {
  const subscriptionNo = `SUB-${generateSnowId()}`;

  const { data, error } = await supabase
    .from('wmc_subscription' as any)
    .insert([{
      ...newSubscription,
      subscription_no: subscriptionNo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return data as unknown as Subscription;
}

/**
 * Find subscription by ID
 */
export async function findSubscriptionById(id: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('wmc_subscription' as any)
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find subscription: ${error.message}`);
  }

  return data as unknown as Subscription | null;
}

/**
 * Find subscription by subscription number
 */
export async function findSubscriptionBySubscriptionNo(
  subscriptionNo: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('wmc_subscription' as any)
    .select('*')
    .eq('subscription_no', subscriptionNo)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find subscription: ${error.message}`);
  }

  return data as unknown as Subscription | null;
}

/**
 * Find subscription by provider subscription ID
 */
export async function findSubscriptionByProviderSubscriptionId({
  provider,
  subscriptionId,
}: {
  provider: string;
  subscriptionId: string;
}): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('wmc_subscription' as any)
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('payment_provider', provider)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find subscription: ${error.message}`);
  }

  return data as unknown as Subscription | null;
}

/**
 * Update subscription by subscription number
 */
export async function updateSubscriptionBySubscriptionNo(
  subscriptionNo: string,
  updates: Partial<Omit<Subscription, 'id' | 'subscription_no' | 'created_at'>>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('wmc_subscription' as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_no', subscriptionNo)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  return data as unknown as Subscription;
}

/**
 * Update subscription within a database transaction
 */
export async function updateSubscriptionInTransaction(
  subscriptionNo: string,
  updates: Partial<Omit<Subscription, 'id' | 'subscription_no' | 'created_at'>>
): Promise<Subscription> {
  const { data, error } = await supabase.rpc('update_subscription' as any, {
    p_subscription_no: subscriptionNo,
    p_updates: {
      ...updates,
      updated_at: new Date().toISOString(),
    },
  });

  if (error) {
    throw new Error(`Failed to update subscription in transaction: ${error.message}`);
  }

  return data as unknown as Subscription;
}

/**
 * Get subscriptions by user ID
 */
export async function getSubscriptionsByUserId({
  userId,
  status,
  limit = 20,
  offset = 0,
}: {
  userId: string;
  status?: SubscriptionStatus;
  limit?: number;
  offset?: number;
}): Promise<Subscription[]> {
  let query = supabase
    .from('wmc_subscription' as any)
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get subscriptions: ${error.message}`);
  }

  return (data as unknown as Subscription[]) || [];
}

/**
 * Get active subscriptions for user
 */
export async function getActiveSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('wmc_subscription' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('current_period_end', { ascending: true });

  if (error) {
    throw new Error(`Failed to get active subscriptions: ${error.message}`);
  }

  return (data as unknown as Subscription[]) || [];
}

/**
 * Get subscription statistics for user
 */
export async function getSubscriptionStats(userId: string): Promise<{
  activeCount: number;
  canceledCount: number;
  totalAmount: number;
}> {
  const { data, error } = await supabase.rpc('get_subscription_stats' as any, { p_user_id: userId });

  if (error) {
    throw new Error(`Failed to get subscription stats: ${error.message}`);
  }

  return data || {
    activeCount: 0,
    canceledCount: 0,
    totalAmount: 0,
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionNo: string,
  reason?: string
): Promise<void> {
  const now = new Date();

  const { error } = await supabase
    .from('wmc_subscription' as any)
    .update({
      status: 'canceled',
      canceled_at: now.toISOString(),
      canceled_end_at: now.toISOString(),
      canceled_reason: reason || 'User requested cancellation',
      canceled_reason_type: 'user_initiated',
      updated_at: now.toISOString(),
    })
    .eq('subscription_no', subscriptionNo);

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Calculate next billing date
 */
export function calculateNextBillingDate(
  currentPeriodEnd: Date,
  interval: string
): Date {
  const nextDate = new Date(currentPeriodEnd);

  switch (interval) {
    case 'day':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'week':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'month':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'year':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid interval: ${interval}`);
  }

  return nextDate;
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  const now = new Date();
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  return (
    subscription.status === 'active' &&
    (!currentPeriodEnd || currentPeriodEnd > now)
  );
}

/**
 * Check if subscription has grace period
 */
export function hasGracePeriod(subscription: Subscription): boolean {
  if (subscription.status !== 'past_due') {
    return false;
  }

  // Grace period is typically 7 days after payment failure
  const lastPaymentAttempt = subscription.updated_at
    ? new Date(subscription.updated_at)
    : new Date();

  const gracePeriodEnd = new Date(lastPaymentAttempt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  return new Date() < gracePeriodEnd;
}

/**
 * Generate unique subscription number
 */
function _generateSubscriptionNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SUB-${timestamp}-${random}`;
}

// ==========================================================================
// Database Functions
// ==========================================================================

/**
 * Create database functions for complex operations
 */
export async function createSubscriptionDatabaseFunctions(): Promise<void> {
  // update_subscription function
  const { error: error1 } = await supabase.rpc('exec_sql' as any, {
    sql: `
      CREATE OR REPLACE FUNCTION update_subscription(p_subscription_no TEXT, p_updates JSONB)
      RETURNS wmc_subscription AS $$
      DECLARE
        v_subscription wmc_subscription;
      BEGIN
        UPDATE wmc_subscription
        SET
          status = COALESCE(p_updates->>'status', status),
          subscription_result = COALESCE(p_updates->>'subscription_result', subscription_result),
          current_period_start = COALESCE((p_updates->>'current_period_start')::TIMESTAMPTZ, current_period_start),
          current_period_end = COALESCE((p_updates->>'current_period_end')::TIMESTAMPTZ, current_period_end),
          canceled_at = COALESCE((p_updates->>'canceled_at')::TIMESTAMPTZ, canceled_at),
          canceled_end_at = COALESCE((p_updates->>'canceled_end_at')::TIMESTAMPTZ, canceled_end_at),
          canceled_reason = COALESCE(p_updates->>'canceled_reason', canceled_reason),
          canceled_reason_type = COALESCE(p_updates->>'canceled_reason_type', canceled_reason_type),
          billing_url = COALESCE(p_updates->>'billing_url', billing_url),
          updated_at = NOW()
        WHERE subscription_no = p_subscription_no
        RETURNING * INTO v_subscription;

        RETURN v_subscription;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error1) {
    console.error('Failed to create update_subscription function:', error1);
  }

  // get_subscription_stats function
  const { error: error2 } = await supabase.rpc('exec_sql' as any, {
    sql: `
      CREATE OR REPLACE FUNCTION get_subscription_stats(p_user_id TEXT)
      RETURNS JSONB AS $$
      DECLARE
        result JSONB;
      BEGIN
        SELECT jsonb_build_object(
          'activeCount', COUNT(*) FILTER (WHERE status = 'active'),
          'canceledCount', COUNT(*) FILTER (WHERE status = 'canceled'),
          'totalAmount', COALESCE(SUM(amount), 0)
        )
        INTO result
        FROM wmc_subscription
        WHERE user_id = p_user_id
          AND deleted_at IS NULL;

        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error2) {
    console.error('Failed to create get_subscription_stats function:', error2);
  }
}

const subscriptionModel = {
  createSubscription,
  findSubscriptionById,
  findSubscriptionBySubscriptionNo,
  findSubscriptionByProviderSubscriptionId,
  updateSubscriptionBySubscriptionNo,
  updateSubscriptionInTransaction,
  getSubscriptionsByUserId,
  getActiveSubscriptions,
  getSubscriptionStats,
  cancelSubscription,
  calculateNextBillingDate,
  isSubscriptionActive,
  createSubscriptionDatabaseFunctions,
};

export default subscriptionModel;