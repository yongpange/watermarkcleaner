// Note: server-only import removed for Edge Runtime compatibility
// This module should only be used on the server side

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hashIPAddress } from '@/lib/security/ip-hash';
import { USER_TIER_CONFIG, type UserTier, type UserTierConfig } from '@/lib/credits/config';

// Re-export types and config for backward compatibility
export { UserTier, UserTierConfig, USER_TIER_CONFIG };

/**
 * Check user's available credits (All users have 3 credits, based on processing history)
 * @param userId - The user's ID from the database
 * @returns Object containing tier info, usage stats, and remaining credits
 */
export async function checkCredits(userId: string) {
  // Use admin client to bypass RLS for accurate counting
  const supabase = createAdminClient();

  console.log(`[Credits] Checking credits for user: ${userId}`);

  // Get user data from database to determine tier
  const { data: user, error: userError } = await (supabase as any)
    .from('wmc_users')
    .select('tier')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error(`[Credits] Failed to fetch user:`, userError);
    throw new Error('User not found');
  }

  // Count lifetime processing history for this user (not monthly)
  const { count, error: countError } = await (supabase as any)
    .from('wmc_processing_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', true);

  if (countError) {
    console.error(`[Credits] Failed to count processing history:`, countError);
    throw new Error('Failed to check credits');
  }

  const used = count ?? 0;
  const tier: UserTier = (user.tier as UserTier) || 'unverified';
  const tierConfig = USER_TIER_CONFIG[tier];

  console.log(`[Credits] User ${userId} has used ${used} credits, limit: ${tierConfig.maxPerMonth}`);

  return {
    tier,
    used,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - used),
  };
}

/**
 * Deduct credits after successful image processing
 * @param userId - The user's ID
 */
export async function deductCredits(userId: string) {
  // Use admin client to bypass RLS for credit updates
  const supabase = createAdminClient();
  
  console.log(`[Credits] Deducting credit for user: ${userId}`);

  // First get the current user to get current creditsused
  const { data: user, error: fetchError } = await (supabase as any)
    .from('wmc_users')
    .select('creditsused')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    console.error(`[Credits] Failed to fetch user for deduction:`, fetchError);
    throw new Error('User not found');
  }
  
  const currentUsed = (user.creditsused || 0);
  const newUsed = currentUsed + 1;
  
  console.log(`[Credits] Current usage: ${currentUsed}, New usage: ${newUsed}`);

  // Update with incremented value
  const { error } = await (supabase as any)
    .from('wmc_users')
    .update({
      creditsused: newUsed,
    })
    .eq('id', userId);

  if (error) {
    console.error(`[Credits] Failed to update creditsused in DB:`, error);
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }
  
  console.log(`[Credits] Deduct success. User ${userId} now has ${newUsed} used credits.`);
}

/**
 * Record processing history (for both authenticated and IP-based users)
 * @param identifier - User ID or IP address
 * @param imageSize - Size of the processed image in bytes
 * @param userId - Optional authenticated user ID
 */
export async function recordProcessingHistory({
  identifier,
  imageSize,
  userId,
  success = true,
}: {
  identifier: string;
  imageSize: number;
  userId?: string;
  success?: boolean;
}) {
  const supabase = await createClient();

  const { error } = await (supabase as any).from('wmc_processing_history').insert({
    user_id: userId,
    ip_address: userId ? null : identifier,
    image_size: imageSize,
    success,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record processing history: ${error.message}`);
  }
}

/**
 * Check remaining credits for both authenticated and IP-based users
 * For authenticated users: Use credit system (wmc_credit table)
 * For IP-based users: Use lifetime processing history count (3 trials total)
 */
export async function checkUserCredits(
  identifier: string,
  isAuthenticated: boolean,
  userId?: string
) {
  if (isAuthenticated && userId) {
    // For authenticated users, use legacy check (wmc_processing_history)
    return checkCredits(userId);
  } else {
    // For IP-based users: 3 trials TOTAL (lifetime, not monthly)
    const tier: UserTier = 'unverified';
    const tierConfig = USER_TIER_CONFIG[tier];

    // IMPORTANT: Hash the IP before querying database
    const hashedIdentifier = await hashIPAddress(identifier);

    console.log('[Credits Check] ===== IP-based User Check Started =====');
    console.log('[Credits Check] Original IP:', identifier);
    console.log('[Credits Check] Hashed IP:', hashedIdentifier);
    console.log('[Credits Check] Counting LIFETIME usage (3 trials total)');

    // Use admin client for IP-based queries to bypass RLS
    const supabase = createAdminClient();

    const { count, error } = await (supabase as any)
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', hashedIdentifier)
      .eq('success', true);

    if (error) {
      console.error('[Credits Check] Supabase query error:', error);
      throw error;
    }

    const actualCount = count ?? 0;

    console.log('[Credits Check] Trials used:', actualCount, '/', tierConfig.maxPerMonth);

    const result = {
      tier,
      used: actualCount,
      limit: tierConfig.maxPerMonth, // 3 trials total for unauthenticated
      remaining: Math.max(0, tierConfig.maxPerMonth - actualCount),
    };

    console.log('[Credits Check] Final result:', result);
    console.log('[Credits Check] ===== IP-based User Check Completed =====');

    return result;
  }
}
