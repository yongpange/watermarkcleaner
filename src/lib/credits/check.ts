import { createClient } from '@/lib/supabase-server';

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
  const supabase = await createClient();

  const { data: user, error } = await (supabase as any)
    .from('watermarkcleaner.users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  // Check if we need to reset monthly credits (on the 1st of each month)
  const now = new Date();
  const lastReset = new Date((user as any).creditsReset || now);

  // Reset if we're in a different month/year than last reset
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    // Reset credits for new month
    const { error: updateError } = await (supabase as any)
      .from('watermarkcleaner.users')
      .update({
        creditsUsed: 0,
        creditsReset: now.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to reset credits: ${updateError.message}`);
    }

    return {
      tier: user.tier as UserTier,
      used: 0,
      limit: USER_TIER_CONFIG[user.tier as UserTier].maxPerMonth,
      remaining: USER_TIER_CONFIG[user.tier as UserTier].maxPerMonth,
    };
  }

  const tierConfig = USER_TIER_CONFIG[user.tier as UserTier];

  return {
    tier: user.tier as UserTier,
    used: user.creditsUsed || 0,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - (user.creditsUsed || 0)),
  };
}

/**
 * Deduct credits after successful image processing
 * @param userId - The user's ID
 */
export async function deductCredits(userId: string) {
  const supabase = await createClient();

  // First get the current user to get current creditsUsed
  const { data: user, error: fetchError } = await (supabase as any)
    .from('watermarkcleaner.users')
    .select('creditsUsed')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('User not found');
  }

  // Update with incremented value
  const { error } = await (supabase as any)
    .from('watermarkcleaner.users')
    .update({
      creditsUsed: (user.creditsUsed || 0) + 1,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }
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

  const { error } = await (supabase as any).from('watermarkcleaner.processing_history').insert({
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

    const supabase = await createClient();
    const { count } = await (supabase as any)
      .from('watermarkcleaner.processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', identifier)
      .gte('created_at', startOfMonth.toISOString())
      .eq('success', true);

    return {
      tier,
      used: count || 0,
      limit: tierConfig.maxPerMonth,
      remaining: Math.max(0, tierConfig.maxPerMonth - (count || 0)),
    };
  }
}
