/**
 * Payment Manager
 * Centralized management of payment providers
 */

import type {
  PaymentProvider,
  PaymentProviderConfigs,
  PaymentOrder,
  PaymentSession,
} from './types';

export interface PaymentManagerConfig {
  defaultProvider?: string;
}

export class PaymentManager {
  private providers = new Map<string, PaymentProvider>();
  public defaultProvider?: string;

  constructor(config?: PaymentManagerConfig) {
    if (config?.defaultProvider) {
      this.defaultProvider = config.defaultProvider;
    }
  }

  /**
   * Add a payment provider
   */
  addProvider(provider: PaymentProvider, isDefault: boolean = false): void {
    this.providers.set(provider.name, provider);
    if (isDefault || !this.defaultProvider) {
      this.defaultProvider = provider.name;
    }
  }

  /**
   * Get a payment provider by name
   */
  getProvider(name?: string): PaymentProvider {
    const providerName = name || this.defaultProvider;

    if (!providerName) {
      throw new Error('No payment provider specified and no default provider set');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider "${providerName}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    return provider;
  }

  /**
   * Check if a provider exists
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get all provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all providers
   */
  getProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Cannot set default provider to "${name}": provider not found`);
    }
    this.defaultProvider = name;
  }

  /**
   * Remove a provider
   */
  removeProvider(name: string): boolean {
    if (this.defaultProvider === name) {
      throw new Error(`Cannot remove default provider "${name}". Set a new default provider first.`);
    }
    return this.providers.delete(name);
  }

  /**
   * Clear all providers
   */
  clearProviders(): void {
    this.providers.clear();
    this.defaultProvider = undefined;
  }

  /**
   * Get provider count
   */
  getProviderCount(): number {
    return this.providers.size;
  }
}

// ==========================================================================
// Factory function
// ==========================================================================

/**
 * Create and configure a payment manager with providers
 */
export function createPaymentManager(
  providers: Array<{ provider: PaymentProvider; isDefault?: boolean }>,
  config?: PaymentManagerConfig
): PaymentManager {
  const manager = new PaymentManager(config);

  for (const { provider, isDefault } of providers) {
    manager.addProvider(provider, isDefault || false);
  }

  return manager;
}

// ==========================================================================
// Default instance
// ==========================================================================

let defaultPaymentManager: PaymentManager | null = null;

/**
 * Get or create the default payment manager
 */
export function getPaymentManager(): PaymentManager {
  if (!defaultPaymentManager) {
    defaultPaymentManager = new PaymentManager();
  }
  return defaultPaymentManager;
}

/**
 * Set the default payment manager
 */
export function setPaymentManager(manager: PaymentManager): void {
  defaultPaymentManager = manager;
}

// ==========================================================================
// Utility type guards
// ==========================================================================

/**
 * Check if a value is a valid payment status
 */
export function isValidPaymentStatus(status: string): status is import('./types').PaymentStatus {
  return ['processing', 'pending', 'paid', 'failed', 'canceled', 'refunded'].includes(status);
}

/**
 * Check if a value is a valid subscription status
 */
export function isValidSubscriptionStatus(status: string): status is import('./types').SubscriptionStatus {
  return [
    'active',
    'pending_cancel',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'trialing',
  ].includes(status);
}

/**
 * Check if a provider name is valid
 */
export function isValidProviderName(name: string): boolean {
  return ['creem', 'stripe', 'paypal'].includes(name);
}

// ==========================================================================
// Common payment utilities
// ==========================================================================

/**
 * Format amount with currency
 */
export function formatAmount(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CNY: '¥',
    JPY: '¥',
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency;
  const dollars = amount / 100;

  return `${symbol}${dollars.toFixed(2)}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

/**
 * Calculate credit expiration date
 */
export function calculateCreditExpiration(validDays?: number, currentPeriodEnd?: Date): Date | null {
  if (currentPeriodEnd) {
    // Use subscription period end if provided
    return new Date(currentPeriodEnd);
  }

  if (!validDays || validDays <= 0) {
    // Never expires
    return null;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);
  return expiresAt;
}
