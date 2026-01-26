/**
 * Payment Service
 * Centralized payment business logic
 */

// import { supabase } from '@/lib/supabase-client';
import { PaymentManager } from '@/extensions/payment';
import { CreemProvider } from '@/extensions/payment/creem';
import { grantCredits } from '@/lib/models/credit';
import { createOrder, updateOrderByOrderNo } from '@/lib/models/order';
import { createSubscription, updateSubscriptionBySubscriptionNo, findSubscriptionByProviderSubscriptionId } from '@/lib/models/subscription';
import {
  // type PaymentOrder,
  type PaymentSession,
  type SubscriptionInfo,
  // type PaymentEventType,
  PaymentStatus,
  SubscriptionStatus,
  PaymentType,
  CreditTransactionScene,
} from '@/extensions/payment/types';
import type { Order } from '@/lib/models/order';
import type { Subscription } from '@/lib/models/subscription';

// ==========================================================================
// Payment Manager Initialization
// ==========================================================================

/**
 * Initialize and configure the payment manager
 * @param providerName - Optional specific provider to use as default
 * @param customConfigs - Optional custom payment configurations
 */
export async function initPaymentManager(
  providerName?: string,
  customConfigs?: ReturnType<typeof getPaymentConfigs>
): Promise<PaymentManager> {
  // Get configuration from parameter or environment/database
  const configs = customConfigs || getPaymentConfigs();

  // Use providerName if provided, otherwise use config's defaultProvider
  const defaultProvider = providerName || configs.defaultProvider;

  const manager = new PaymentManager({
    defaultProvider: defaultProvider,
  });

  // Add Creem provider
  if (configs.creem.enabled) {
    const creemProvider = new CreemProvider({
      apiKey: configs.creem.apiKey,
      signingSecret: configs.creem.signingSecret,
      environment: configs.creem.environment,
    });

    manager.addProvider(creemProvider, defaultProvider === 'creem');
  }

  // Add Stripe provider (future)
  if (configs.stripe.enabled) {
    // const stripeProvider = new StripeProvider({...});
    // manager.addProvider(stripeProvider, configs.defaultProvider === 'stripe');
  }

  // Add PayPal provider (future)
  if (configs.paypal.enabled) {
    // const paypalProvider = new PayPalProvider({...});
    // manager.addProvider(paypalProvider, configs.defaultProvider === 'paypal');
  }

  return manager;
}

/**
 * Get payment configuration from environment
 */
export function getPaymentConfigs() {
  return {
    defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'creem',
    creem: {
      enabled: process.env.CREEM_ENABLED === 'true',
      apiKey: process.env.CREEM_API_KEY || '',
      signingSecret: process.env.CREEM_SIGNING_SECRET || '',
      environment: (process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    },
    stripe: {
      enabled: process.env.STRIPE_ENABLED === 'true',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      signingSecret: process.env.STRIPE_SIGNING_SECRET || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
    paypal: {
      enabled: process.env.PAYPAL_ENABLED === 'true',
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      secret: process.env.PAYPAL_SECRET || '',
    },
  };
}

// ==========================================================================
// Checkout Success Handler
// ==========================================================================

/**
 * Handle successful payment checkout
 * This is called from the webhook when payment succeeds
 */
export async function handleCheckoutSuccess({
  order,
  session,
}: {
  order: Order;
  session: PaymentSession;
}): Promise<void> {
  const orderNo = order.order_no;

  // Check if order is already paid (idempotency)
  if (order.status === 'paid') {
    console.log(`Order ${orderNo} already paid, skipping`);
    return;
  }

  try {
    // Update order status
    const orderUpdates: Partial<Order> = {
      status: 'paid' as PaymentStatus,
      payment_result: JSON.stringify({
        paymentId: session.paymentInfo?.paymentId,
        transactionId: session.paymentInfo?.transactionId,
        paidAt: session.paymentInfo?.paidAt,
        ...session.paymentInfo,
      }),
      transaction_id: session.paymentInfo?.transactionId,
      paid_at: session.paymentInfo?.paidAt?.toISOString(),
    };

    if (session.subscriptionId && session.subscriptionInfo) {
        orderUpdates.subscription_id = session.subscriptionId;
        orderUpdates.subscription_result = JSON.stringify(session.subscriptionInfo);
    }

    await updateOrderByOrderNo(orderNo, orderUpdates);

    console.log(`Order ${orderNo} marked as paid`);

    // If this is a subscription, create/update subscription record
    if (order.payment_type === 'subscription' && session.subscriptionInfo) {
      await handleSubscriptionCreation({
        order,
        subscriptionInfo: session.subscriptionInfo,
      });
    }

    // Grant credits to user
    if (order.credits_amount && order.credits_amount > 0) {
      await handleCreditGrant({
        userId: order.user_id,
        credits: order.credits_amount,
        orderNo,
        subscriptionNo: session.subscriptionInfo?.subscriptionId,
        validDays: order.credits_valid_days || undefined,
        isSubscription: order.payment_type === 'subscription',
        subscriptionInfo: session.subscriptionInfo,
      });
    }
  } catch (error) {
    console.error(`Failed to handle checkout success for order ${orderNo}:`, error);
    throw error;
  }
}

// ==========================================================================
// Subscription Management
// ==========================================================================

/**
 * Handle subscription creation/update
 */
export async function handleSubscriptionCreation({
  order,
  subscriptionInfo,
}: {
  order: Order;
  subscriptionInfo: SubscriptionInfo;
}): Promise<void> {
  const existingSubscription = await findSubscriptionByProviderSubscriptionId({
    provider: order.payment_provider,
    subscriptionId: subscriptionInfo.subscriptionId,
  });

  if (existingSubscription) {
    // Update existing subscription
    const updates: Partial<Subscription> = {
      status: subscriptionInfo.status as SubscriptionStatus,
      current_period_start: subscriptionInfo.currentPeriodStart?.toISOString() || null,
      current_period_end: subscriptionInfo.currentPeriodEnd?.toISOString() || null,
    };

    if (subscriptionInfo.canceledAt) {
      updates.canceled_at = subscriptionInfo.canceledAt.toISOString();
    }

    await updateSubscriptionBySubscriptionNo(
      existingSubscription.subscription_no,
      updates
    );

    console.log(`Updated subscription ${subscriptionInfo.subscriptionId}`);
  } else {
    // Create new subscription
    const newSubscription = await createSubscription({
      user_id: order.user_id,
      user_email: order.user_email,
      status: subscriptionInfo.status as SubscriptionStatus,
      payment_provider: order.payment_provider,
      subscription_id: subscriptionInfo.subscriptionId,
      subscription_result: JSON.stringify(subscriptionInfo),
      product_id: order.product_id,
      product_name: order.product_name,
      amount: subscriptionInfo.amount || order.amount,
      currency: subscriptionInfo.currency || order.currency,
      interval: subscriptionInfo.interval ?? undefined,
      interval_count: subscriptionInfo.intervalCount ?? 1,
      trial_period_days: subscriptionInfo.trialPeriodDays ?? undefined,
      current_period_start: subscriptionInfo.currentPeriodStart?.toISOString() ?? null,
      current_period_end: subscriptionInfo.currentPeriodEnd?.toISOString() ?? null,
      plan_name: order.plan_name,
      credits_amount: order.credits_amount,
      credits_valid_days: order.credits_valid_days,
    });

    console.log(`Created subscription ${newSubscription.subscription_no}`);
  }
}

/**
 * Handle subscription renewal (recurring payment)
 */
export async function handleSubscriptionRenewal({
  subscription,
  session: _session,
}: {
  subscription: Subscription;
  session: PaymentSession;
}): Promise<void> {
  // Create a new order for the renewal payment
  const renewalOrder: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'> = {
    user_id: subscription.user_id,
    user_email: subscription.user_email || undefined,
    status: PaymentStatus.PAID,
    amount: subscription.amount || 0,
    currency: subscription.currency || 'usd',
    payment_type: PaymentType.SUBSCRIPTION,
    payment_interval: subscription.interval as any,
    payment_provider: subscription.payment_provider,
    product_id: subscription.product_id,
    product_name: subscription.product_name,
    plan_name: subscription.plan_name,
    credits_amount: subscription.credits_amount,
    credits_valid_days: subscription.credits_valid_days,
    checkout_info: '{}', // Required by createOrder but not used for renewal
  };

  const order = await createOrder(renewalOrder);

  console.log(`Created renewal order ${order.order_no}`);

  // Grant renewal credits
  if (subscription.credits_amount && subscription.credits_amount > 0) {
    await handleCreditGrant({
      userId: subscription.user_id,
      credits: subscription.credits_amount,
      subscriptionNo: subscription.subscription_no,
      validDays: subscription.credits_valid_days || undefined,
      isSubscription: true,
      isRenewal: true,
    });
  }
}

/**
 * Handle subscription update (status change, etc.)
 */
export async function handleSubscriptionUpdated({
  subscription,
  session,
}: {
  subscription: Subscription;
  session: PaymentSession;
}): Promise<void> {
  if (!session.subscriptionInfo) {
    throw new Error('Missing subscription info in session');
  }

  const updates: Partial<Subscription> = {
    status: session.subscriptionInfo.status as SubscriptionStatus,
    current_period_start: session.subscriptionInfo.currentPeriodStart?.toISOString() || null,
    current_period_end: session.subscriptionInfo.currentPeriodEnd?.toISOString() || null,
  };

  if (session.subscriptionInfo.cancelAtPeriodEnd !== undefined) {
    updates.canceled_end_at = session.subscriptionInfo.cancelAtPeriodEnd
      ? session.subscriptionInfo.currentPeriodEnd?.toISOString() || null
      : null;
  }

  await updateSubscriptionBySubscriptionNo(
    subscription.subscription_no,
    updates
  );

  console.log(`Updated subscription status for ${subscription.subscription_no}`);
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCanceled({
  subscription,
  session,
}: {
  subscription: Subscription;
  session: PaymentSession;
}): Promise<void> {
  if (!session.subscriptionInfo) {
    throw new Error('Missing subscription info in session');
  }

  const cancelAt = session.subscriptionInfo.canceledAt || new Date();

  await updateSubscriptionBySubscriptionNo(subscription.subscription_no, {
    status: SubscriptionStatus.CANCELED,
    canceled_at: cancelAt.toISOString(),
    canceled_end_at: session.subscriptionInfo.currentPeriodEnd?.toISOString() || null,
    canceled_reason: session.subscriptionInfo.cancelReason || 'Customer canceled',
    canceled_reason_type: 'user_initiated',
  });

  console.log(`Cancelled subscription ${subscription.subscription_no}`);
}

// ==========================================================================
// Credit Management
// ==========================================================================

/**
 * Handle credit granting
 */
export async function handleCreditGrant({
  userId,
  credits,
  orderNo,
  subscriptionNo,
  validDays,
  isSubscription = false,
  isRenewal = false,
  subscriptionInfo,
}: {
  userId: string;
  credits: number;
  orderNo?: string;
  subscriptionNo?: string;
  validDays?: number;
  isSubscription?: boolean;
  isRenewal?: boolean;
  subscriptionInfo?: SubscriptionInfo;
}): Promise<void> {
  try {
    // Calculate expiration
    let expiresAt: Date | undefined;

    if (isSubscription && subscriptionInfo?.currentPeriodEnd) {
      // Align with subscription period
      expiresAt = subscriptionInfo.currentPeriodEnd;
    } else if (validDays) {
      // Use valid days
      const now = new Date();
      expiresAt = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
    }

    await grantCredits({
      userId,
      credits,
      orderNo,
      subscriptionNo,
      expiresAt,
      scene: isRenewal
        ? CreditTransactionScene.RENEWAL
        : isSubscription
        ? CreditTransactionScene.SUBSCRIPTION
        : CreditTransactionScene.PAYMENT,
      description: isRenewal
        ? 'Subscription renewal credits'
        : isSubscription
        ? 'Subscription credits'
        : 'One-time purchase credits',
    });

    console.log(`Granted ${credits} credits to user ${userId}`);
  } catch (error) {
    console.error(`Failed to grant credits to user ${userId}:`, error);
    throw error;
  }
}

const paymentService = {
  initPaymentManager,
  getPaymentConfigs,
  handleCheckoutSuccess,
  handleSubscriptionCreation,
  handleSubscriptionRenewal,
  handleSubscriptionUpdated,
  handleSubscriptionCanceled,
  handleCreditGrant,
};

export default paymentService;