// Note: server-only import removed for Edge Runtime compatibility
// This module should only be used on the server side

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hashIPAddress } from '@/lib/security/ip-hash';
import { USER_TIER_CONFIG, type UserTier, type UserTierConfig } from '@/lib/credits/config';

// Re-export types and config for backward compatibility
export { UserTier, UserTierConfig, USER_TIER_CONFIG };

// Helper function for timestamp
const getTimestamp = () => new Date().toISOString();

/**
 * Check user's available credits (All users have 3 credits, based on processing history)
 * @param userId - The user's ID from the database
 * @returns Object containing tier info, usage stats, and remaining credits
 */
export async function checkCredits(userId: string, currentIp?: string) {
  // Use admin client to bypass RLS for accurate counting
  const supabase = createAdminClient();

  console.log(`[Credits] [${getTimestamp()}] Checking credits for user: ${userId}`);

  // Get user data from database to determine tier
  const { data: user, error: userError } = await (supabase as any)
    .from('wmc_users')
    .select('tier')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error(`[Credits] [${getTimestamp()}] Failed to fetch user:`, userError);
    throw new Error('User not found');
  }

  console.log(`[Credits] [${getTimestamp()}] User fetched:`, { userId, tier: user.tier });

  // 1. 获取该用户所有处理记录中的 IP 地址
  // This finds IPs that were explicitly linked to this user in the past
  console.log(`[Credits] [${getTimestamp()}] Fetching user's IP addresses from processing history...`);
  const { data: userRecords, error: fetchError } = await (supabase as any)
    .from('wmc_processing_history')
    .select('ip_address')
    .eq('user_id', userId)
    .eq('success', true);

  if (fetchError) {
    console.error(`[Credits] [${getTimestamp()}] Failed to fetch user records:`, fetchError);
    throw new Error('Failed to check credits');
  }

  // 2. Collect all IPs to check: historical IPs + current IP
  const ipsToCheck = new Set<string>();
  
  // Add historical IPs
  userRecords?.forEach((r: any) => {
    if (r.ip_address) ipsToCheck.add(r.ip_address);
  });

  // Add current IP if provided (CRITICAL: linking current session to past anonymous usage)
  if (currentIp) {
    const hashedCurrentIp = await hashIPAddress(currentIp);
    ipsToCheck.add(hashedCurrentIp);
    console.log(`[Credits] [${getTimestamp()}] Added current IP to check list:`, { raw: currentIp, hashed: hashedCurrentIp });
  }

  const userIPs = Array.from(ipsToCheck);
  console.log(`[Credits] [${getTimestamp()}] Total unique IPs to check:`, { count: userIPs.length, ips: userIPs });

  // 3. 构建查询条件
  // Logic: user_id = userId OR ip_address IN (userIPs)
  
  let count = 0;
  
  if (userIPs.length > 0) {
    // Complex query: user_id OR ip_address
    const ipConditions = userIPs.map(ip => `ip_address.eq.${ip}`).join(',');
    const orCondition = `user_id.eq.${userId},${ipConditions}`;
    
    console.log(`[Credits] [${getTimestamp()}] Querying with OR condition (User + IPs)`);
    
    const { count: totalData, error: countError } = await (supabase as any)
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .or(orCondition)
      .eq('success', true);

      if (countError) {
        console.error(`[Credits] [${getTimestamp()}] Failed to count processing history:`, countError);
        throw new Error('Failed to check credits');
      }
      count = totalData ?? 0;
  } else {
    // Fallback: Simple query by user_id only (if no IPs found/provided)
    console.log(`[Credits] [${getTimestamp()}] Querying by user_id only (No IPs available)`);
    
    const { count: totalData, error: countError } = await (supabase as any)
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('success', true);

      if (countError) {
        console.error(`[Credits] [${getTimestamp()}] Failed to count processing history:`, countError);
        throw new Error('Failed to check credits');
      }
      count = totalData ?? 0;
  }

  const used = count;
  const tier: UserTier = (user.tier as UserTier) || 'unverified';
  const tierConfig = USER_TIER_CONFIG[tier];

  console.log(`[Credits] [${getTimestamp()}] Credit check complete:`, {
    userId,
    tier,
    used,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - used)
  });

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

  console.log(`[Credits] [${getTimestamp()}] Deducting credit for user: ${userId}`);

  // First get the current user to get current creditsused
  const { data: user, error: fetchError } = await (supabase as any)
    .from('wmc_users')
    .select('creditsused')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    console.error(`[Credits] [${getTimestamp()}] Failed to fetch user for deduction:`, fetchError);
    throw new Error('User not found');
  }

  const currentUsed = (user.creditsused || 0);
  const newUsed = currentUsed + 1;

  console.log(`[Credits] [${getTimestamp()}] Current usage: ${currentUsed}, New usage: ${newUsed}`);

  // Update with incremented value
  const { error } = await (supabase as any)
    .from('wmc_users')
    .update({
      creditsused: newUsed,
    })
    .eq('id', userId);

  if (error) {
    console.error(`[Credits] [${getTimestamp()}] Failed to update creditsused in DB:`, error);
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  console.log(`[Credits] [${getTimestamp()}] Deduct success. User ${userId} now has ${newUsed} used credits.`);
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
  userId?: string,
  currentIp?: string
) {
  console.log(`[Credits] [${getTimestamp()}] ===== USER CREDIT CHECK STARTED =====`);
  console.log(`[Credits] [${getTimestamp()}] Input:`, { identifier, isAuthenticated, userId, currentIp: currentIp ? '***' : 'undefined' });

  if (isAuthenticated && userId) {
    console.log(`[Credits] [${getTimestamp()}] Authenticated user, using checkCredits() with IP linking...`);
    // For authenticated users, use legacy check (wmc_processing_history) includes IP linking
    return checkCredits(userId, currentIp);
  } else {
    console.log(`[Credits] [${getTimestamp()}] IP-based user, checking lifetime usage (3 trials)`);
    // For IP-based users: 3 trials TOTAL (lifetime, not monthly)
    const tier: UserTier = 'unverified';
    const tierConfig = USER_TIER_CONFIG[tier];

    console.log(`[Credits] [${getTimestamp()}] Hashing IP address...`);
    // IMPORTANT: Hash the IP before querying database
    const ipToCheck = currentIp || identifier; // Use currentIp if passed, otherwise identifier
    const hashedIdentifier = await hashIPAddress(ipToCheck);

    console.log(`[Credits] [${getTimestamp()}] IP hash complete:`, {
      originalIP: ipToCheck ? ipToCheck.substring(0, 10) + '...' : 'N/A',
      hashed: hashedIdentifier.substring(0, 20) + '...'
    });

    console.log(`[Credits] [${getTimestamp()}] Querying wmc_processing_history...`);
    console.log(`[Credits] [${getTimestamp()}] Supabase query:`, {
      table: 'wmc_processing_history',
      conditions: {
        ip_address: hashedIdentifier,
        success: true
      },
      count: 'exact'
    });

    // Use admin client for IP-based queries to bypass RLS
    const supabase = createAdminClient();

    const { count, error } = await (supabase as any)
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', hashedIdentifier)
      .eq('success', true);

    if (error) {
      console.error(`[Credits] [${getTimestamp()}] Supabase query error:`, error);
      throw error;
    }

    const actualCount = count ?? 0;
    const remaining = Math.max(0, tierConfig.maxPerMonth - actualCount);

    console.log(`[Credits] [${getTimestamp()}] Query complete:`, {
      trialsUsed: actualCount,
      limit: tierConfig.maxPerMonth,
      remaining: remaining
    });

    const result = {
      tier,
      used: actualCount,
      limit: tierConfig.maxPerMonth, // 3 trials total for unauthenticated
      remaining: remaining,
    };

    console.log(`[Credits] [${getTimestamp()}] ===== IP-BASED CHECK COMPLETE =====`);
    console.log(`[Credits] [${getTimestamp()}] Result:`, result);

    return result;
  }
}
