/**
 * Credit Model
 * Handles all database operations for credit management (FIFO)
 */

import { supabase } from '@/lib/supabase-client';
import type {
  CreditTransactionType,
  CreditTransactionScene,
} from '@/extensions/payment/types';

// ==========================================================================
// Types
// ==========================================================================

export interface Credit {
  id: string;
  user_id: string;
  user_email?: string | null;
  order_no?: string | null;
  subscription_no?: string | null;
  subscription_id?: string | null; // Link to subscription table
  transaction_no: string;
  transaction_type: CreditTransactionType;
  transaction_scene?: string | null;
  credits: number; // Positive for grant, negative for consume
  description?: string | null;
  metadata?: string | null;
  expires_at?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  scene?: CreditTransactionScene;
  description?: string;
  metadata?: Record<string, any>;
  createdDate: Date;
}

// ==========================================================================
// Credit Granting
// ==========================================================================

/**
 * Grant credits to a user
 */
export async function grantCredits({
  userId,
  credits,
  orderNo,
  subscriptionNo,
  validDays,
  expiresAt,
  scene,
  description,
  metadata,
}: {
  userId: string;
  credits: number;
  orderNo?: string;
  subscriptionNo?: string;
  validDays?: number;
  expiresAt?: Date;
  scene?: CreditTransactionScene;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<Credit> {
  // Validate
  if (credits <= 0) {
    throw new Error('Credits must be positive for grant operation');
  }

  // Calculate expiration
  let finalExpiresAt = expiresAt || null;
  if (validDays && !finalExpiresAt) {
    const now = new Date();
    finalExpiresAt = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
  }

  const transactionNo = `CR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data, error } = await supabase
    .from('wmc_credit')
    .insert([{
      user_id: userId,
      order_no: orderNo,
      subscription_no: subscriptionNo,
      transaction_no: transactionNo,
      transaction_type: 'grant',
      transaction_scene: scene || 'payment',
      credits: credits,
      subscription_id: subscriptionNo ? null : null, // Will be updated after subscription creation
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      expires_at: finalExpiresAt?.toISOString() || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to grant credits: ${error.message}`);
  }

  return data as Credit;
}

// ==========================================================================
// Credit Consumption (FIFO - First In, First Out)
// ==========================================================================

/**
 * Consume credits from a user (FIFO algorithm)
 * Returns transaction record if successful.
 * Instead of updating remaining_credits, we now insert a consume record and calculate balance on-the-fly.
 */
export async function consumeCredits({
  userId,
  amount,
  scene,
  imageSize,
  processingTime,
  metadata,
}: {
  userId: string;
  amount: number;
  scene?: CreditTransactionScene;
  imageSize?: string;
  processingTime?: string;
  metadata?: Record<string, any>;
}): Promise<Credit> {
  // Validate
  if (amount <= 0) {
    throw new Error('Consumption amount must be positive');
  }

  // Check if user has enough credits
  const balance = await getCreditBalance(userId);
  if (balance < amount) {
    throw new Error(`Insufficient credits. Required: ${amount}, Available: ${balance}`);
  }

  // Create consumption record
  const transactionNo = `CC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data: consumeRecord, error: insertError } = await supabase
    .from('wmc_credit')
    .insert([{
      user_id: userId,
      transaction_no: transactionNo,
      transaction_type: 'consume',
      transaction_scene: scene || 'image_processing',
      credits: -amount,
      description: `Consumed ${amount} credits`,
      metadata: JSON.stringify({
        imageSize,
        processingTime,
        ...metadata,
      }),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create consumption record: ${insertError.message}`);
  }

  // Update user stats
  await updateUserCreditStats(userId);

  return consumeRecord as Credit;
}

// ==========================================================================
// Credit Balance Queries
// ==========================================================================

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_credit_balance', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to get credit balance:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Get total granted credits for user
 */
export async function getTotalGranted(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('wmc_credit')
    .select('credits')
    .eq('user_id', userId)
    .eq('transaction_type', 'grant')
    .eq('status', 'active');

  if (error) {
    console.error('Failed to get total granted:', error);
    return 0;
  }

  return (data || []).reduce((sum, credit) => sum + (credit.credits || 0), 0);
}

/**
 * Get total consumed credits for user
 */
export async function getTotalConsumed(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('wmc_credit')
    .select('credits')
    .eq('user_id', userId)
    .eq('transaction_type', 'consume')
    .eq('status', 'active');

  if (error) {
    console.error('Failed to get total consumed:', error);
    return 0;
  }

  return (data || []).reduce((sum, credit) => sum + Math.abs(credit.credits || 0), 0);
}

// ==========================================================================
// Credit History
// ==========================================================================

/**
 * Get credit transaction history for user
 */
export async function getCreditHistory({
  userId,
  transactionType,
  scene,
  limit = 50,
  offset = 0,
}: {
  userId: string;
  transactionType?: CreditTransactionType;
  scene?: CreditTransactionScene;
  limit?: number;
  offset?: number;
}): Promise<Credit[]> {
  let query = supabase
    .from('wmc_credit')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (transactionType) {
    query = query.eq('transaction_type', transactionType);
  }

  if (scene) {
    query = query.eq('transaction_scene', scene);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get credit history: ${error.message}`);
  }

  return (data as Credit[]) || [];
}

// ==========================================================================
// Credit Expiration
// ==========================================================================

/**
 * Expire credits that have passed their expiration date
 */
export async function expireCredits(): Promise<number> {
  const { count, error } = await supabase
    .from('wmc_credit')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'active')
    .eq('transaction_type', 'grant')
    .gt('remaining_credits', 0)
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to expire credits:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get expiring credits (within next 7 days)
 */
export async function getExpiringCredits(userId?: string): Promise<Credit[]> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let query = supabase
    .from('wmc_credit')
    .select('*')
    .eq('status', 'active')
    .eq('transaction_type', 'grant')
    .gt('remaining_credits', 0)
    .gte('expires_at', now.toISOString())
    .lt('expires_at', in7Days.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get expiring credits:', error);
    return [];
  }

  return (data as Credit[]) || [];
}

// ==========================================================================
// User Stats
// ==========================================================================

/**
 * Update user credit statistics
 */
export async function updateUserCreditStats(userId: string): Promise<void> {
  const granted = await getTotalGranted(userId);
  const consumed = await getTotalConsumed(userId);
  const balance = await getCreditBalance(userId);

  const { error } = await supabase
    .from('wmc_users')
    .update({
      total_credits_granted: granted,
      total_credits_consumed: consumed,
      credits_balance: balance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user credit stats:', error);
  }
}

// ==========================================================================
// Migration from Free to Pro
// ==========================================================================

/**
 * Migrate free user history to credit system
 * This is called when user upgrades from free to pro
 */
export async function migrateFreeUserHistory(
  userId: string,
  creditsToGrant: number
): Promise<{ granted: number; consumed: number }> {
  // Get history count from wmc_processing_history
  const { count: historyCount, error: countError } = await supabase
    .from('wmc_processing_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', true);

  if (countError) {
    throw new Error(`Failed to get processing history: ${countError.message}`);
  }

  const consumedCount = countError ? 0 : (historyCount || 0);

  // Grant Pro credits
  await grantCredits({
    userId,
    credits: creditsToGrant,
    scene: 'migration',
    description: 'Migration from free to pro',
  });

  // If there was history consumption, record it
  if (consumedCount > 0) {
    await consumeCredits({
      userId,
      amount: consumedCount,
      scene: 'migration',
      metadata: {
        migratedFromFree: true,
        description: `Migrated ${consumedCount} historical processing records`,
      },
    });
  }

  // Update user migration flags
  await supabase
    .from('wmc_users')
    .update({
      upgraded_from_free: true,
      free_usage_migrated: consumedCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return {
    granted: creditsToGrant,
    consumed: consumedCount,
  };
}

// ==========================================================================
// Database Functions
// ==========================================================================

/**
 * Create database functions for credit operations
 */
export async function createCreditDatabaseFunctions(): Promise<void> {
  // get_credit_balance function
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id TEXT)
      RETURNS INTEGER AS $$
      DECLARE
        v_balance INTEGER;
      BEGIN
        SELECT COALESCE(SUM(remaining_credits), 0)
        INTO v_balance
        FROM wmc_credit
        WHERE user_id = p_user_id
          AND status = 'active'
          AND transaction_type = 'grant'
          AND remaining_credits > 0
          AND (expires_at IS NULL OR expires_at > NOW());

        RETURN v_balance;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error1) {
    console.error('Failed to create get_credit_balance function:', error1);
  }

  // expire_credits function
  const { error: error2 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION expire_credits()
      RETURNS INTEGER AS $$
      DECLARE
        v_count INTEGER;
      BEGIN
        UPDATE wmc_credit
        SET status = 'expired',
            updated_at = NOW()
        WHERE status = 'active'
          AND transaction_type = 'grant'
          AND remaining_credits > 0
          AND expires_at < NOW();

        GET DIAGNOSTICS v_count = ROW_COUNT;
        RETURN v_count;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error2) {
    console.error('Failed to create expire_credits function:', error2);
  }
}

// ==========================================================================
// Cache Layer (Optional Performance Optimization)
// ==========================================================================

const creditBalanceCache = new Map<string, { balance: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get credit balance with caching
 */
export async function getCreditBalanceCached(userId: string, useCache: boolean = true): Promise<number> {
  if (useCache) {
    const cached = creditBalanceCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.balance;
    }
  }

  const balance = await getCreditBalance(userId);

  if (useCache) {
    creditBalanceCache.set(userId, {
      balance,
      timestamp: Date.now(),
    });
  }

  return balance;
}

/**
 * Invalidate credit balance cache
 */
export function invalidateCreditBalanceCache(userId: string): void {
  creditBalanceCache.delete(userId);
}

export default {
  grantCredits,
  consumeCredits,
  getCreditBalance,
  getTotalGranted,
  getTotalConsumed,
  getCreditHistory,
  expireCredits,
  getExpiringCredits,
  updateUserCreditStats,
  migrateFreeUserHistory,
  createCreditDatabaseFunctions,
  getCreditBalanceCached,
  invalidateCreditBalanceCache,
};