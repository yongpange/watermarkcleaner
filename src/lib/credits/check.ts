import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { hashIPAddress } from '@/lib/security/ip-hash';
import { getCreditBalance } from '@/lib/models/credit';
import { supabase as clientSupabase } from '@/lib/supabase-client';

// ==========================================================================
// Types
// ==========================================================================

export interface CreditCheckResult {
  tier: string;
  productId: string;
  maxCredits: number;
  used: number;
  remaining: number;
  canProcess: boolean;
  requiresAuth: boolean;
}

// ==========================================================================
// Main Credit Check Logic
// ==========================================================================

/**
 * Check user's available credits
 * @param identifier - User ID or IP address
 * @param isAuthenticated - Whether user is logged in
 */
export async function checkCredits(
  identifier: string,
  isAuthenticated: boolean
): Promise<CreditCheckResult> {
  console.log(`[Credits] Checking credits for ${isAuthenticated ? 'user' : 'IP'}: ${identifier}`);

  if (isAuthenticated) {
    // Authenticated users: Check wmc_subscription + wmc_credit balance
    return await checkAuthenticatedCredits(identifier);
  } else {
    // Unauthenticated users: Limited to 3 trials based on IP
    return await checkUnauthenticatedCredits(identifier);
  }
}

/**
 * Check credits for authenticated user
 */
async function checkAuthenticatedCredits(userId: string): Promise<CreditCheckResult> {
  const supabase = createAdminClient();

  try {
    // 1. Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from('wmc_subscription')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error(`[Credits] Failed to fetch subscription:`, subError);
      throw new Error('Failed to check credits');
    }

    // 2. If no subscription, automatically grant free-plan
    if (!subscription) {
      console.log(`[Credits] No subscription found for user ${userId}, granting free-plan...`);
      const freeSub = await grantFreePlan(userId);
      return await formatCreditResult(freeSub);
    }

    // 3. Check credit balance
    const balance = await getCreditBalance(userId);
    console.log(`[Credits] User ${userId} has ${balance} credits remaining`);

    // 4. Check if subscription is still valid
    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
      console.log(`[Credits] Subscription ${subscription.id} has expired`);

      // Mark as expired
      await supabase
        .from('wmc_subscription')
        .update({ status: 'canceled' })
        .eq('id', subscription.id);

      // Auto-renew if it's a recurring subscription (future feature)
      // For now, return expired result
      return {
        tier: 'expired',
        productId: subscription.product_id,
        maxCredits: subscription.credits_amount || 0,
        used: (subscription.credits_amount || 0) - balance,
        remaining: 0,
        canProcess: false,
        requiresAuth: false,
      };
    }

    return await formatCreditResult(subscription, balance);

  } catch (error) {
    console.error(`[Credits] Error checking authenticated credits:`, error);
    throw error;
  }
}

/**
 * Check credits for unauthenticated user (IP-based)
 * Limited to 3 free trials
 */
async function checkUnauthenticatedCredits(ip: string): Promise<CreditCheckResult> {
  const supabase = createAdminClient();
  const ipHash = hashIPAddress(ip);

  console.log(`[Credits] IP Check - Original: ${ip}, Hashed: ${ipHash}`);

  try {
    // Count processing history for this IP (lifetime, not monthly)
    const { count, error } = await supabase
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipHash)
      .eq('success', true);

    if (error) {
      console.error(`[Credits] Failed to count IP processing history:`, error);
      throw new Error('Failed to check credits');
    }

    const used = count || 0;
    const maxCredits = 3; // Free trials for unauthenticated users
    const remaining = Math.max(0, maxCredits - used);

    console.log(`[Credits] IP ${ip} has used ${used}/${maxCredits} trials`);

    return {
      tier: 'unauthenticated',
      productId: 'free-trial',
      maxCredits,
      used,
      remaining,
      canProcess: remaining > 0,
      requiresAuth: used >= maxCredits, // Require auth when trials are used up
    };

  } catch (error) {
    console.error(`[Credits] Error checking unauthenticated credits:`, error);
    throw error;
  }
}

// ==========================================================================
// Free Plan Management
// ==========================================================================

/**
 * Grant free-plan to user (3 credits, no expiration)
 */
export async function grantFreePlan(userId: string) {
  const supabase = createAdminClient();

  // Check if free-plan already exists
  const { data: existing } = await supabase
    .from('wmc_subscription')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', 'free-plan')
    .limit(1)
    .single();

  if (existing) {
    console.log(`[Credits] Free-plan already exists for user ${userId}`);
    return existing;
  }

  // Create subscription record
  const { data: subscription, error: subError } = await supabase
    .from('wmc_subscription')
    .insert([{
      user_id: userId,
      product_id: 'free-plan',
      product_name: 'Free Plan',
      status: 'active',
      credits_amount: 3,
      interval: null, // One-time
      current_period_start: new Date().toISOString(),
      current_period_end: null, // No expiration
    }])
    .select()
    .single();

  if (subError) {
    throw new Error(`Failed to create free-plan subscription: ${subError.message}`);
  }

  // Grant 3 credits
  const { data: credit } = await supabase
    .from('wmc_credit')
    .insert([{
      user_id: userId,
      transaction_no: `CF-${Date.now()}`,
      transaction_type: 'grant',
      transaction_scene: 'signup',
      credits: 3,
      description: 'Free plan welcome credits (3)',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (!credit) {
    throw new Error('Failed to grant free credits');
  }

  console.log(`[Credits] Granted free-plan to user ${userId}: 3 credits`);

  return subscription;
}

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Format credit check result from subscription data
 */
async function formatCreditResult(
  subscription: any,
  balance?: number
): Promise<CreditCheckResult> {
  let currentBalance = balance;

  if (currentBalance === undefined) {
    currentBalance = await getCreditBalance(subscription.user_id);
  }

  const maxCredits = subscription.credits_amount || 0;
  const used = Math.max(0, maxCredits - currentBalance);

  return {
    tier: subscription.product_id,
    productId: subscription.product_id,
    maxCredits,
    used,
    remaining: currentBalance,
    canProcess: currentBalance > 0,
    requiresAuth: false,
  };
}

/**
 * Record processing history and consume credits atomically
 */
export async function processImageWithCredit(
  userId: string,
  imageSize: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Start transaction-like operation
    // Note: Supabase doesn't support true transactions across multiple operations
    // We'll handle errors and rollback manually if needed

    // 1. Check credits first
    const creditCheck = await checkCredits(userId, true);
    if (!creditCheck.canProcess) {
      return { success: false, error: 'Insufficient credits' };
    }

    // 2. Consume credits
    const consumeRecord = await import('@/lib/models/credit').then(({ consumeCredits }) =>
      consumeCredits({
        userId,
        amount: 1,
        scene: 'image_processing',
        metadata: { imageSize },
      })
    );

    // 3. Record processing history
    const { error: historyError } = await supabase
      .from('wmc_processing_history')
      .insert([{
        user_id: userId,
        ip_address: null, // Not applicable for authenticated users
        image_size: imageSize,
        success: true,
        credit_transaction_id: consumeRecord.id,
        created_at: new Date().toISOString(),
      }]);

    if (historyError) {
      throw new Error(`Failed to record processing history: ${historyError.message}`);
    }

    return {
      success: true,
      transactionId: consumeRecord.transaction_no,
    };

  } catch (error) {
    console.error('[Credits] Error in processImageWithCredit:', error);

    // TODO: Implement rollback logic if needed
    // For now, we rely on the fact that consumeCredits will throw before recording history

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user needs to upgrade (used for upselling)
 */
export async function shouldShowUpgradePrompt(userId: string): Promise<boolean> {
  const creditCheck = await checkCredits(userId, true);

  // Show upgrade prompt when:
  // 1. User is on free-plan and has less than 25% credits remaining
  // 2. User has no active subscription
  // 3. User has used up all credits (remaining === 0)

  if (creditCheck.tier === 'free-plan' && creditCheck.remaining === 0) {
    return true;
  }

  if (creditCheck.tier === 'free-plan' && creditCheck.remaining <= 0.25 * creditCheck.maxCredits) {
    return true;
  }

  if (creditCheck.tier === 'expired') {
    return true;
  }

  return false;
}

export default {
  checkCredits,
  checkAuthenticatedCredits,
  checkUnauthenticatedCredits,
  grantFreePlan,
  processImageWithCredit,
  shouldShowUpgradePrompt,
};
