/**
 * Creem Payment Provider
 * Documentation: https://docs.creem.io
 */

// Removed Node.js crypto import to be Edge compatible
// import crypto from 'crypto';

import {
  PaymentStatus,
  PaymentInterval,
  PaymentEventType,
  SubscriptionStatus,
} from './types';

import type {
  PaymentProvider,
  PaymentProviderConfigs,
  PaymentOrder,
  PaymentResult,
  PaymentSessionResult,
  PaymentEvent,
  PaymentSession,
  BillingResult,
  SubscriptionInfo,
  PaymentInfo,
  SubscriptionCycleType,
} from './types';

interface CreemCheckoutData {
  id: string;
  url: string;
  status: string;
  order: {
    id: string;
    product: {
      id: string;
      name: string;
      price: {
        amount: number;
        currency: string;
      };
    };
  };
  customer?: {
    id: string;
    email: string;
    name?: string;
  };
  subscriptionId?: string;
  subscription?: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
  };
  metadata?: Record<string, any>;
}

interface CreemSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  price: {
    id: string;
    amount: number;
    currency: string;
  };
  product: {
    id: string;
    name: string;
  };
  billing_cycle: {
    interval: string;
    interval_count: number;
  };
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  metadata?: Record<string, any>;
}

interface CreemConfigs {
  apiKey: string;
  signingSecret?: string;
  environment?: 'sandbox' | 'production';
}

export class CreemProvider implements PaymentProvider {
  name = 'creem';
  configs: CreemConfigs;
  baseUrl: string;

  constructor(configs: CreemConfigs) {
    this.configs = configs;
    this.baseUrl =
      configs.environment === 'production'
        ? 'https://api.creem.io'
        : 'https://test-api.creem.io';
  }

  // ==========================================================================
  // Create Payment (Checkout)
  // ==========================================================================

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      const {
        amount,
        currency,
        productId,
        providerProductId,
        customer,
        successUrl,
        cancelUrl,
        paymentType,
        paymentInterval,
        metadata = {},
      } = order;

      // 构建checkout数据
      const checkoutData: any = {
        product_id: providerProductId || productId,
        price: {
          amount: amount / 100, // to dollar
          currency: currency.toLowerCase(),
        },
        metadata: {
          order_no: order.orderNo,
          product_id: productId,
          ...(metadata || {}),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      };

      // 添加客户信息
      if (customer) {
        checkoutData.customer = {
          email: customer.email,
          name: customer.name,
          metadata: {
            user_id: order.userId,
          },
        };

        // 如果已有customerId，使用existingCustomerEmail
        if (customer.id) {
          checkoutData.existingCustomerEmail = customer.email;
        }
      }

      // 订阅类型
      if (paymentType === 'subscription') {
        checkoutData.type = 'subscription';

        if (paymentInterval) {
          checkoutData.billing_cycle = {
            interval: paymentInterval,
            interval_count: 1, // will be overwritten by product settings
          };
        }
      }

      // 发送请求
      const response = await fetch(`${this.baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.configs.apiKey,
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Creem checkout failed: ${response.status} ${errorData.message || ''}`
        );
      }

      const data = await response.json();

      if (!data?.data?.id) {
        throw new Error('Invalid Creem checkout response: missing checkout ID');
      }

      const checkout: CreemCheckoutData = data.data;

      return {
        success: true,
        checkoutUrl: checkout.url,
        sessionId: checkout.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==========================================================================
  // Get Payment Session
  // ==========================================================================

  async getPaymentSession(sessionId: string): Promise<PaymentSessionResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/checkouts?checkout_id=${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.configs.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Creem get checkout failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.data) {
        throw new Error('Invalid Creem checkout response');
      }

      const checkout: CreemCheckoutData = data.data;

      // 构建支付会话
      const session: PaymentSession = {
        id: checkout.id,
        url: checkout.url,
        status: this.mapStatus(checkout.status),
        customerId: checkout.customer?.id,
        customerEmail: checkout.customer?.email,
        metadata: checkout.metadata,
      };

      // 如果已支付，添加支付信息
      if (checkout.status === 'completed') {
        const paymentInfo: PaymentInfo = {
          paidAt: new Date(), // Creem doesn't provide this in get checkout
        };

        // 如果是订阅
        if (checkout.subscriptionId && checkout.subscription) {
          const subscriptionInfo: SubscriptionInfo = {
            subscriptionId: checkout.subscriptionId,
            status: this.mapSubscriptionStatus(checkout.subscription.status),
            currentPeriodStart: new Date(checkout.subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(checkout.subscription.current_period_end * 1000),
            amount: checkout.order.product.price.amount,
            currency: checkout.order.product.price.currency,
          };

          session.subscriptionId = checkout.subscriptionId;
          session.subscriptionInfo = subscriptionInfo;
        }
      }

      return {
        success: true,
        session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==========================================================================
  // Get Payment Event (Webhook)
  // ==========================================================================

  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent | null> {
    try {
      const rawBody = await req.text();
      const signature = req.headers.get('creem-signature');

      if (!signature) {
        throw new Error('Missing creem-signature header');
      }

      // 验证签名
      if (this.configs.signingSecret) {
        const computedSignature = await this.generateSignature(
          rawBody,
          this.configs.signingSecret
        );

        if (computedSignature !== signature) {
          throw new Error('Invalid webhook signature');
        }
      }

      const eventData = JSON.parse(rawBody);

      if (!eventData?.type) {
        throw new Error('Invalid webhook event: missing type');
      }

      // 解析事件
      const eventType = eventData.type;
      const data = eventData.data;

      let paymentEvent: PaymentEvent | null = null;

      // checkout.completed
      if (eventType === 'checkout.completed') {
        if (!this.isValidCheckout(data)) {
          throw new Error('Invalid checkout data');
        }

        const checkout: CreemCheckoutData = data;
        const subscriptionInfo: SubscriptionInfo | undefined =
          checkout.subscription && checkout.subscriptionId
            ? {
                subscriptionId: checkout.subscriptionId,
                status: this.mapSubscriptionStatus(checkout.subscription.status),
                currentPeriodStart: new Date(checkout.subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(checkout.subscription.current_period_end * 1000),
              }
            : undefined;

        paymentEvent = {
          eventType: PaymentEventType.CHECKOUT_SUCCESS,
          raw: eventData,
          paymentSession: {
            id: checkout.id,
            status: this.mapStatus(checkout.status),
            paymentInfo: {
              amountReceived: checkout.order.product.price.amount,
              currency: checkout.order.product.price.currency,
              paidAt: new Date(),
            },
            subscriptionId: checkout.subscriptionId,
            subscriptionInfo,
            customerId: checkout.customer?.id,
            customerEmail: checkout.customer?.email,
            metadata: checkout.metadata,
          },
        };
      }
      // payment.succeeded
      else if (eventType === 'payment.succeeded') {
        const payment = data;
        const subscriptionInfo: SubscriptionInfo | undefined =
          payment.subscription
            ? this.buildSubscriptionInfo(payment.subscription)
            : undefined;

        let subscriptionCycleType: SubscriptionCycleType | undefined;
        if (subscriptionInfo) {
          const subscription: CreemSubscription = payment.subscription;

          // Determine cycle type based on period dates
          const periodStart = new Date(subscription.current_period_start * 1000);
          const periodEnd = new Date(subscription.current_period_end * 1000);
          const periodLengthDays =
            (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);

          // If period started near the beginning and is roughly a month, it's a renewal
        }

        paymentEvent = {
          eventType: PaymentEventType.PAYMENT_SUCCESS,
          raw: eventData,
          paymentSession: {
            id: payment.id,
            status: PaymentStatus.PAID,
            paymentInfo: {
              amountReceived: payment.amount,
              currency: payment.currency,
              transactionId: payment.id,
              subscriptionCycleType,
              paidAt: new Date(payment.created_at * 1000),
            },
            subscriptionId: payment.subscription?.id,
            subscriptionInfo,
          },
        };
      }
      // subscription.updated
      else if (eventType === 'subscription.updated') {
        const subscription: CreemSubscription = data;

        paymentEvent = {
          eventType: PaymentEventType.SUBSCRIBE_UPDATED,
          raw: eventData,
          paymentSession: {
            id: subscription.id,
            status: PaymentStatus.PAID,
            subscriptionInfo: this.buildSubscriptionInfo(subscription),
            subscriptionId: subscription.id,
          },
        };
      }
      // subscription.canceled
      else if (eventType === 'subscription.canceled') {
        const subscription: CreemSubscription = data;

        paymentEvent = {
          eventType: PaymentEventType.SUBSCRIBE_CANCELED,
          raw: eventData,
          paymentSession: {
            id: subscription.id,
            status: PaymentStatus.CANCELED,
            subscriptionInfo: this.buildSubscriptionInfo(subscription),
            subscriptionId: subscription.id,
          },
        };
      }

      return paymentEvent;
    } catch (error: any) {
      console.error('Error parsing Creem webhook:', error);
      return {
        eventType: PaymentEventType.PAYMENT_FAILED,
        raw: {},
        error: {
          code: 'WEBHOOK_PARSE_ERROR',
          message: error.message,
        },
      };
    }
  }

  // ==========================================================================
  // Get Billing Portal
  // ==========================================================================

  async getPaymentBilling({
    customerId,
  }: {
    customerId: string;
  }): Promise<BillingResult | null> {
    try {
      // Creem doesn't provide a direct billing portal
      // This would need to be implemented via customer portal or custom solution
      return null;
    } catch (error: any) {
      console.error('Error getting Creem billing:', error);
      return null;
    }
  }

  // ==========================================================================
  // Cancel Subscription
  // ==========================================================================

  async cancelSubscription({
    subscriptionId,
    cancelAtPeriodEnd = true,
  }: {
    subscriptionId: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.configs.apiKey,
          },
          body: JSON.stringify({
            // Creem uses at_period_end parameter
            at_period_end: cancelAtPeriodEnd,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Creem cancel subscription failed: ${response.status}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error canceling Creem subscription:', error);
      return { success: false };
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Generate HMAC-SHA256 signature for webhook verification
   */
  /**
   * Generate HMAC-SHA256 signature for webhook verification
   */
  private async generateSignature(
    payload: string,
    secret: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, msgData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Validate checkout data structure
   */
  private isValidCheckout(data: any): data is CreemCheckoutData {
    return (
      data &&
      typeof data === 'object' &&
      'id' in data &&
      'status' in data &&
      'order' in data &&
      data.order &&
      'product' in data.order
    );
  }

  /**
   * Map Creem status to PaymentStatus
   */
  private mapStatus(creemStatus: string): PaymentStatus {
    switch (creemStatus) {
      case 'completed':
      case 'paid':
        return PaymentStatus.PAID;
      case 'pending':
      case 'open':
        return PaymentStatus.PENDING;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return PaymentStatus.CANCELED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  /**
   * Map Creem subscription status to SubscriptionStatus
   */
  private mapSubscriptionStatus(creemStatus: string): SubscriptionStatus {
    switch (creemStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  /**
   * Build SubscriptionInfo from Creem subscription
   */
  private buildSubscriptionInfo(
    subscription: CreemSubscription
  ): SubscriptionInfo {
    return {
      subscriptionId: subscription.id,
      status: this.mapSubscriptionStatus(subscription.status),
      amount: subscription.price.amount,
      currency: subscription.price.currency,
      interval: subscription.billing_cycle.interval as PaymentInterval,
      intervalCount: subscription.billing_cycle.interval_count,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialPeriodDays: subscription.trial_end
        ? Math.ceil((subscription.trial_end - subscription.trial_start!) / (1000 * 60 * 60 * 24))
        : undefined,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : undefined,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
    };
  }

  /**
   * Convert BigInt to number (utility)
   */
  public converBigIntToNumber(value: any): any {
    if (typeof value === 'bigint') {
      return Number(value);
    } else if (Array.isArray(value)) {
      return value.map(this.converBigIntToNumber);
    } else if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.converBigIntToNumber(val);
      }
      return result;
    }
    return value;
  }
}
