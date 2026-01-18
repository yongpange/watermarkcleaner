/**
 * Credit and Payment Utils for easy interaction with credit and payment systems.
 */

import { initPaymentManager, handleCreditGrant } from '@/lib/payment/service';
import { grantCredits, getCreditBalance, consumeCredits } from '@/lib/models/credit';
import { updateOrderByOrderNo } from '@/lib/models/order';
import type { PaymentStatus } from '@/extensions/payment/types';

export class PaymentUtils {
  /**
   * Static method to grant credits to a user
   * @param userId The ID of the user
   * @param credits The number of credits to grant
   * @param options Optional parameters
   */
  static async grantCredits(
    userId: string,
    credits: number,
    options?: {
      orderNo?: string;
      subscriptionNo?: string;
      validDays?: number;
      expiresAt?: Date;
      scene?: string;
      description?: string;
    }
  ) {
    return await grantCredits({
      userId,
      credits: credits,
      orderNo: options?.orderNo,
      subscriptionNo: options?.subscriptionNo,
      validDays: options?.validDays,
      scene: options?.scene as any,
      description: options?.description,
      expiresAt: options?.expiresAt,
      metadata: options?.subscriptionNo || options?.orderNo ? { linkedTo: options.subscriptionNo || options.orderNo } : undefined,
    });
  }

  /**
   * Check user's current credit balance
   * @param userId The ID of the user
   * @returns The number of credits available
   */
  static async checkBalance(userId: string): Promise<number> {
    return await getCreditBalance(userId);
  }

  /**
   * Consume credits from user's balance
   * @param userId The ID of the user
   * @param amount The number of credits to consume
   * @param options Optional parameters
   */
  static async consumeCredits(
    userId: string,
    amount: number,
    options?: {
      scene?: string;
      imageSize?: string;
      processingTime?: string;
      metadata?: Record<string, any>;
    }
  ) {
    return await consumeCredits({
      userId,
      amount,
      scene: options?.scene as any,
      imageSize: options?.imageSize,
      processingTime: options?.processingTime,
      metadata: options?.metadata,
    });
  }
}

/**
 * Quick function to check if a user has enough credits
 * @param userId The ID of the user
 * @param required The number of credits required
 * @returns true if user has enough credits, false otherwise
 */
export async function userHasCredits(userId: string, required: number = 1): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= required;
}

/**
 * Record a payment as paid and grant credits
 * @param orderNo The order number
 * @param credits Amount of credits to grant
 * @param transactionId The payment transaction ID
 */
export async function completePaymentAndGrantCredits(
  orderNo: string,
  credits: number,
  transactionId: string,
  provider: string,
  paidAt: Date = new Date()
) {
  // Update order status
  await updateOrderByOrderNo(orderNo, {
    status: 'paid' as PaymentStatus,
    transaction_id: transactionId,
    paid_at: paidAt.toISOString(),
  });

  // Grant credits
  await handleCreditGrant({
    userId: '', // Order will need to contain userId
    credits: credits,
    orderNo: orderNo,
  });
}
