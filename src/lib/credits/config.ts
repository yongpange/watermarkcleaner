/**
 * Credit System Configuration
 * Pure configuration constants, usable on both client and server
 */

// ==========================================================================
// Product/Plan Types
// ==========================================================================

export type ProductId =
  | 'free-plan'
  | 'basic-monthly'
  | 'pro-monthly'
  | 'business-monthly'
  | 'basic-yearly'
  | 'pro-yearly';

export type SubscriptionInterval = 'month' | 'year' | null;

// ==========================================================================
// Product Configuration
// ==========================================================================

export interface ProductConfig {
  productId: ProductId;
  displayName: string;
  amount: number; // In dollars (e.g., 9.99)
  credits: number;
  interval: SubscriptionInterval;
  validDays: number | null; // null for lifetime
  pricePerCredit?: number; // Calculated field
}

/**
 * All available products/plans configuration
 * Matches pricing.json files
 */
export const PRODUCT_CONFIG: Record<ProductId, ProductConfig> = {
  // Free plan - Lifetime 3 credits
  'free-plan': {
    productId: 'free-plan',
    displayName: 'Free Plan',
    amount: 0,
    credits: 3,
    interval: null,
    validDays: null,
    pricePerCredit: 0,
  },

  // Monthly plans
  'basic-monthly': {
    productId: 'basic-monthly',
    displayName: 'Basic',
    amount: 6.99,
    credits: 100,
    interval: 'month',
    validDays: 30,
    pricePerCredit: 0.0699,
  },
  'pro-monthly': {
    productId: 'pro-monthly',
    displayName: 'Pro',
    amount: 9.99,
    credits: 200,
    interval: 'month',
    validDays: 30,
    pricePerCredit: 0.04995,
  },
  'business-monthly': {
    productId: 'business-monthly',
    displayName: 'Business',
    amount: 14.99,
    credits: 500,
    interval: 'month',
    validDays: 30,
    pricePerCredit: 0.02998,
  },

  // Yearly plans (50% off)
  'basic-yearly': {
    productId: 'basic-yearly',
    displayName: 'Basic Yearly',
    amount: 44.99,
    credits: 1200,
    interval: 'year',
    validDays: 365,
    pricePerCredit: 0.03749,
  },
  'pro-yearly': {
    productId: 'pro-yearly',
    displayName: 'Pro Yearly',
    amount: 69.99,
    credits: 2400,
    interval: 'year',
    validDays: 365,
    pricePerCredit: 0.02916,
  },
};

// ==========================================================================
// Legacy User Tier System (Deprecated)
// ⚠️ These are kept for backward compatibility but should be removed eventually
// ==========================================================================

export type UserTier = 'unverified' | 'verified' | 'pro';

export interface UserTierConfig {
  maxPerMonth: number; // Maximum images (now deprecated, use credits instead)
  displayName: string;
}

/**
 * @deprecated Use PRODUCT_CONFIG instead
 * Kept for backward compatibility
 */
export const USER_TIER_CONFIG: Record<UserTier, UserTierConfig> = {
  unverified: {
    maxPerMonth: 3,
    displayName: 'Free Trial',
  },
  verified: {
    maxPerMonth: 3,
    displayName: 'Free Trial',
  },
  pro: {
    maxPerMonth: Infinity,
    displayName: 'Pro',
  },
};

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Get product configuration by ID
 */
export function getProductConfig(productId: ProductId): ProductConfig {
  const config = PRODUCT_CONFIG[productId];
  if (!config) {
    throw new Error(`Product not found: ${productId}`);
  }
  return config;
}

/**
 * Get all products by interval
 */
export function getProductsByInterval(interval: SubscriptionInterval): ProductConfig[] {
  return Object.values(PRODUCT_CONFIG).filter(p => p.interval === interval);
}

/**
 * Calculate effective monthly price (for yearly plans)
 */
export function getEffectiveMonthlyPrice(productId: ProductId): number {
  const config = getProductConfig(productId);

  if (config.interval === 'month') {
    return config.amount;
  }

  if (config.interval === 'year') {
    return config.amount / 12;
  }

  return 0; // free plan
}

/**
 * Get savings percentage (for yearly plans vs monthly)
 */
export function getSavingsPercentage(yearProductId: ProductId): number {
  const yearConfig = getProductConfig(yearProductId);

  if (yearConfig.interval !== 'year') {
    return 0;
  }

  // Find equivalent monthly plan
  const monthProductId = yearProductId.replace('-yearly', '-monthly') as ProductId;
  const monthConfig = PRODUCT_CONFIG[monthProductId];

  if (!monthConfig) {
    return 0;
  }

  const monthlyTotalYear = monthConfig.amount * 12;
  const savings = monthlyTotalYear - yearConfig.amount;
  return Math.round((savings / monthlyTotalYear) * 100);
}

/**
 * Get featured product (default: pro-monthly)
 */
export function getFeaturedProduct(): ProductConfig {
  return getProductConfig('pro-monthly');
}

/**
 * Check if product is free
 */
export function isFreeProduct(productId: ProductId): boolean {
  return productId === 'free-plan';
}

// ==========================================================================
// Exports
// ==========================================================================

export const PRODUCT_IDS = Object.keys(PRODUCT_CONFIG) as ProductId[];
export const USER_TIERS = Object.keys(USER_TIER_CONFIG) as UserTier[];

