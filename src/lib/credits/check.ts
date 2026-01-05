import 'server-only'; // 🚨 禁止在客户端导入 - 包含 Service Role Key

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hashIPAddress } from '@/lib/security/ip-hash';

// User tier configuration matching the 3-10 tier strategy
export type UserTier = 'unverified' | 'verified' | 'pro';

export interface UserTierConfig {
  maxPerMonth: number; // Maximum images per month
  displayName: string; // Display name for the tier
}

export const USER_TIER_CONFIG: Record<UserTier, UserTierConfig> = {
  unverified: {
    maxPerMonth: 3, // 3 images per month for unverified users
    displayName: '免费试用',
  },
  verified: {
    maxPerMonth: 10, // 10 images per month for verified users
    displayName: '已验证用户',
  },
  pro: {
    maxPerMonth: Infinity, // Unlimited for pro users
    displayName: '专业版',
  },
};

/**
 * Check user's available credits
 * @param userId - The user's ID from the database
 * @returns Object containing tier info, usage stats, and remaining credits
 */
export async function checkCredits(userId: string) {
  // Use admin client to ensure we can read/update strictly
  const supabase = createAdminClient();

  console.log(`[Credits] Checking credits for user: ${userId}`);

  const { data: user, error } = await (supabase as any)
    .from('wmc_users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error(`[Credits] User not found or error:`, error);
    throw new Error('User not found');
  }

  // Check if we need to reset monthly credits (on the 1st of each month)
  const now = new Date();
  const lastReset = new Date((user as any).creditsreset || now); // Note lower case match DB
  
  // Debug log for fields
  console.log(`[Credits] User found. Tier: ${user.tier}, Used: ${user.creditsused}, Reset: ${user.creditsreset}`);

  // Reset if we're in a different month/year than last reset
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    console.log(`[Credits] Resetting credits for user ${userId}. Last reset: ${lastReset}, Now: ${now}`);
    
    // Reset credits for new month
    const { error: updateError } = await (supabase as any)
      .from('wmc_users')
      .update({
        creditsused: 0,
        creditsreset: now.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error(`[Credits] Failed to reset credits:`, updateError);
      throw new Error(`Failed to reset credits: ${updateError.message}`);
    }
    
    console.log(`[Credits] Credits reset successfully.`);

    return {
      tier: user.tier as UserTier,
      used: 0,
      limit: USER_TIER_CONFIG[user.tier as UserTier].maxPerMonth,
      remaining: USER_TIER_CONFIG[user.tier as UserTier].maxPerMonth,
    };
  }

  const tierConfig = USER_TIER_CONFIG[user.tier as UserTier];
  const used = (user as any).creditsused || 0;

  return {
    tier: user.tier as UserTier,
    used: used,
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
 * For authenticated users: Use their tier from the database
 * For IP-based users: Determine tier based on verification status (simplified)
 */
export async function checkUserCredits(
  identifier: string,
  isAuthenticated: boolean,
  userId?: string
) {
  if (isAuthenticated && userId) {
    // For authenticated users, use database records
    return checkCredits(userId);
  } else {
    // For IP-based users, use simplified logic
    // These are always considered 'unverified' tier
    const tier: UserTier = 'unverified';
    const tierConfig = USER_TIER_CONFIG[tier];

    // Count IP-based processing history for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // IMPORTANT: Hash the IP before querying database
    // The database stores IP hashes, not raw IPs
    const hashedIdentifier = hashIPAddress(identifier);

    console.log('[Credits Check] ===== IP-based User Check Started =====');
    console.log('[Credits Check] Original IP:', identifier);
    console.log('[Credits Check] Hashed IP:', hashedIdentifier);
    console.log('[Credits Check] Query period:', startOfMonth.toISOString(), 'to', now.toISOString());

    // FIX: Use admin client for IP-based queries to bypass RLS
    console.log('[Credits Check] Creating admin client (bypass RLS)...');
    const supabase = createAdminClient();

    console.log('[Credits Check] Executing Supabase query...');
    console.log('[Credits Check] Table: wmc_processing_history');
    console.log('[Credits Check] Conditions:');
    console.log('  - ip_address:', hashedIdentifier);
    console.log('  - created_at >=', startOfMonth.toISOString());
    console.log('  - success: true');

    const { count, error } = await (supabase as any)
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', hashedIdentifier)  // Use hashed IP to match stored hashes
      .gte('created_at', startOfMonth.toISOString())
      .eq('success', true);

    if (error) {
      console.error('[Credits Check] Supabase query error:', error);
      throw error;
    }

    // FIX: Supabase count can be null when no records found, default to 0
    const actualCount = count ?? 0;

    console.log('[Credits Check] Query result count:', count, '(raw) =>', actualCount, '(used)');

    const result = {
      tier,
      used: actualCount,
      limit: tierConfig.maxPerMonth,
      remaining: Math.max(0, tierConfig.maxPerMonth - actualCount),
    };

    console.log('[Credits Check] Final result:', result);
    console.log('[Credits Check] ===== IP-based User Check Completed =====');

    return result;
  }
}
