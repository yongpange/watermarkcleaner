/**
 * Free Plan Auto-Grant Service
 * Automatically assigns free-plan (3 credits) to users
 */

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { grantCredits } from '@/lib/models/credit';
import type { Subscription } from '@/lib/models/subscription';

// ==========================================================================
// Main Functions
// ==========================================================================

/**
 * Grant free-plan to user (3 credits, lifetime)
 * Called automatically when user is created or first accesses the app
 *
 * @param userId - The user's ID
 * @returns The created subscription record
 */
export async function grantFreePlan(userId: string): Promise<Subscription> {
  const supabase = createAdminClient();

  console.log(`[FreePlan] Granting free-plan to user: ${userId}`);

  try {
    // 1. Check if user already has free-plan
    const { data: existing, error: checkError } = await supabase
      .from('wmc_subscription')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', 'free-plan')
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(1)
      .single();

    if (existing) {
      console.log(`[FreePlan] User ${userId} already has free-plan subscription: ${existing.id}`);
      return existing as Subscription;
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows
      throw checkError;
    }

    // 2. Create subscription record
    const subscriptionData = {
      user_id: userId,
      user_email: '', // Will be updated when user profile is available
      status: 'active',
      payment_provider: 'internal',
      product_id: 'free-plan',
      product_name: 'Free Plan',
      amount: 0,
      currency: 'usd',
      interval: null, // One-time
      interval_count: null,
      trial_period_days: null,
      current_period_start: new Date().toISOString(),
      current_period_end: null, // No expiration
      credits_amount: 3,
      credits_valid_days: null, // No expiration
      plan_name: 'Free',
    };

    const { data: subscription, error: subError } = await supabase
      .from('wmc_subscription')
      .insert([subscriptionData])
      .select()
      .single();

    if (subError) {
      throw new Error(`Failed to create free-plan subscription: ${subError.message}`);
    }

    console.log(`[FreePlan] Created subscription: ${subscription.id}`);

    // 3. Grant 3 credits
    const credit = await grantCredits({
      userId,
      credits: 3,
      scene: 'signup',
      description: 'Free plan welcome credits (3 credits, lifetime)',
    });

    console.log(`[FreePlan] Granted 3 credits: ${credit.id}`);

    // 4. Update subscription with subscription_no if available
    if (credit.subscription_no) {
      await supabase
        .from('wmc_subscription')
        .update({ subscription_no: credit.subscription_no })
        .eq('id', subscription.id);
    }

    console.log(`[FreePlan] Successfully granted free-plan to user ${userId}`);

    return subscription as Subscription;

  } catch (error) {
    console.error(`[FreePlan] Failed to grant free-plan to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Ensure user has a valid subscription
 * If no subscription exists, grant free-plan automatically
 *
 * @param userId - The user's ID
 * @returns The user's active subscription (free-plan or paid)
 */
export async function ensureUserHasSubscription(userId: string): Promise<Subscription> {
  const supabase = createAdminClient();

  // 1. Check for any active subscription
  const { data: subscription, error } = await supabase
    .from('wmc_subscription')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw error;
  }

  // 2. If subscription exists, return it
  if (subscription) {
    console.log(`[Subscription] User ${userId} has active subscription: ${subscription.product_id}`);
    return subscription as Subscription;
  }

  // 3. No subscription found, grant free-plan
  console.log(`[Subscription] User ${userId} has no subscription, granting free-plan...`);
  return await grantFreePlan(userId);
}

/**
 * Check if user can process image
 * Used before image processing to verify credits
 *
 * @param userId - The user's ID (optional, if not provided, uses IP-based check)
 * @param ip - The user's IP address (optional, for unauthenticated users)
 * @returns Whether user can process and remaining credits
 */
export async function canUserProcess(
  userId?: string,
  ip?: string
): Promise<{ canProcess: boolean; remaining: number; requiresAuth?: boolean }> {
  // Unauthenticated user - IP based
  if (!userId && ip) {
    const ipHash = hashIPAddress(ip);
    const { count } = await createAdminClient()
      .from('wmc_processing_history')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipHash)
      .eq('success', true);

    const used = count || 0;
    const maxCredits = 3;
    const remaining = Math.max(0, maxCredits - used);

    return {
      canProcess: remaining > 0,
      remaining,
      requiresAuth: used >= maxCredits,
    };
  }

  // Authenticated user
  if (userId) {
    const balance = await getCreditBalance(userId);

    return {
      canProcess: balance > 0,
      remaining: balance,
      requiresAuth: false,
    };
  }

  // No identifier provided
  return {
    canProcess: false,
    remaining: 0,
    requiresAuth: true,
  };
}

/**
 * Initialize user on first visit or registration
 * Called from auth callbacks or when user first accesses the app
 *
 * @param userId - The user's ID
 * @param userEmail - The user's email
 * @returns void
 */
export async function initializeUser(userId: string, userEmail?: string): Promise<void> {
  try {
    // 1. Ensure user has subscription (free-plan by default)
    const subscription = await ensureUserHasSubscription(userId);

    // 2. If user email is provided and subscription is free-plan, update email
    if (userEmail && subscription.product_id === 'free-plan') {
      await createAdminClient()
        .from('wmc_subscription')
        .update({ user_email: userEmail })
        .eq('id', subscription.id);
    }

    console.log(`[UserInit] User ${userId} initialized successfully`);

  } catch (error) {
    console.error(`[UserInit] Failed to initialize user ${userId}:`, error);
    // Don't throw - initialization failure shouldn't block user registration
  }
}

// ==========================================================================
// Event Handlers
// ==========================================================================

/**
 * Handle user signup event
 * Called from Auth callback
 */
export async function handleUserSignup({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string;
}) {
  console.log(`[Auth] New user signed up: ${userId} (${email})`);

  await initializeUser(userId, email);
}

/**
 * Handle user login event
 * Ensure user has subscription on login
 */
export async function handleUserLogin(userId: string) {
  console.log(`[Auth] User logged in: ${userId}`);

  await ensureUserHasSubscription(userId);
}

// ==========================================================================
// Statistics
// ==========================================================================

/**
 * Get free-plan statistics
 */
export async function getFreePlanStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  conversionRate: number;
}> {
  const supabase = createAdminClient();

  // Total users with free-plan
  const { count: totalUsers } = await supabase
    .from('wmc_subscription')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', 'free-plan');

  // Active free-plan users (with remaining credits)
  const { count: activeUsers } = await supabase
    .from('wmc_credit')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_no', 'free-plan') // or check by join
    .gt('credits', 0);

  // Users who upgraded from free-plan
  const { count: upgradedUsers } = await supabase
    .from('wmc_subscription')
    .select('*', { count: 'exact', head: true })
    .neq('product_id', 'free-plan')
    .not('user_id', 'in', '(SELECT user_id FROM wmc_subscription WHERE product_id = "free-plan")');

  const conversionRate = totalUsers ? (upgradedUsers || 0) / (totalUsers || 1) : 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    conversionRate: Math.round(conversionRate * 100),
  };
}

export default {
  grantFreePlan,
  ensureUserHasSubscription,
  canUserProcess,
  initializeUser,
  handleUserSignup,
  handleUserLogin,
  getFreePlanStats,
};
