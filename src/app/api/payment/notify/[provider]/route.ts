import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { initPaymentManager } from '@/lib/payment/service';
import {
  findOrderByOrderNo,
  findOrderByTransactionId,
} from '@/lib/models/order';
import {
  findSubscriptionByProviderSubscriptionId,
} from '@/lib/models/subscription';
import {
  handleCheckoutSuccess,
  handleSubscriptionRenewal,
  handleSubscriptionUpdated,
  handleSubscriptionCanceled,
} from '@/lib/payment/service';
import type { PaymentEventType } from '@/extensions/payment/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Extract provider from the URL path
  const pathname = request.nextUrl.pathname;
  const provider = pathname.split('/').slice(-2, -1)[0]; // Get the provider from /api/payment/notify/[provider]/route

  try {
    console.log(`Webhook received from provider: ${provider}`);

    // Initialize payment manager
    const paymentManager = await initPaymentManager();

    // Get provider instance
    const paymentProvider = paymentManager.getProvider(provider);
    if (!paymentProvider) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment provider "${provider}" not found`,
        },
        { status: 404 }
      );
    }

    // Get payment event from webhook
    let event;
    try {
      event = await paymentProvider.getPaymentEvent({ req: request });
    } catch (_error: any) {
      console.error(`Webhook parsing error for provider ${provider}:`, _error);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid webhook: ${_error.message}`,
        },
        { status: 400 }
      );
    }

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment event not found in webhook payload',
        },
        { status: 400 }
      );
    }

    const eventType = event.eventType;
    const session = event.paymentSession;

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment session not found in webhook payload',
        },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case PaymentEventType.CHECKOUT_SUCCESS: {
        // One-time payment or subscription first payment
        const orderNo = session.metadata?.order_no;

        if (!orderNo) {
          console.error('Order number not found in metadata');
          return NextResponse.json(
            {
              success: false,
              message: 'Order number not found in metadata',
            },
            { status: 400 }
          );
        }

        const order = await findOrderByOrderNo(orderNo);
        if (!order) {
          console.error(`Order not found: ${orderNo}`);
          return NextResponse.json(
            {
              success: false,
              message: `Order not found: ${orderNo}`,
            },
            { status: 404 }
          );
        }

        await handleCheckoutSuccess({ order, session });

        console.log(`Successfully processed checkout for order ${orderNo}`);
        break;
      }

      case PaymentEventType.PAYMENT_SUCCESS: {
        // Subscription renewal or one-time payment
        if (session.subscriptionId && session.subscriptionInfo) {
          const existingSubscription = await findSubscriptionByProviderSubscriptionId({
            provider,
            subscriptionId: session.subscriptionId,
          });

          if (!existingSubscription) {
            console.log(`Subscription ${session.subscriptionId} not found, skipping renewal`);
            return NextResponse.json(
              {
                success: true,
                message: 'Subscription not found, cannot process renewal',
              },
              { status: 200 }
            );
          }

          // Check if this is a renewal
          const isRenewal = detectRenewal(session);

          if (isRenewal) {
            // Idempotency check - skip if transaction already processed
            const existingOrder = await findOrderByTransactionId({
              transactionId: session.paymentInfo?.transactionId,
              paymentProvider: provider,
            });

            if (existingOrder) {
              console.log(`Transaction ${session.paymentInfo?.transactionId} already processed, skipping`);
              return NextResponse.json(
                {
                  success: true,
                  message: 'Transaction already processed',
                },
                { status: 200 }
              );
            }

            await handleSubscriptionRenewal({
              subscription: existingSubscription,
              session,
            });

            console.log(`Successfully processed renewal for subscription ${session.subscriptionId}`);
          } else {
            console.log(`Subscription ${session.subscriptionId}: skipping payment success as this is first payment`);
          }
        } else {
          // One-time payment - handled by checkout success event
          console.log('One-time payment success, handled by checkout event');
        }
        break;
      }

      case PaymentEventType.SUBSCRIBE_UPDATED: {
        // Only handle subscription updates
        if (!session.subscriptionId || !session.subscriptionInfo) {
          return NextResponse.json(
            {
              success: false,
              message: 'Subscription ID or info not found',
            },
            { status: 400 }
          );
        }

        const existingSubscription = await findSubscriptionByProviderSubscriptionId({
          provider,
          subscriptionId: session.subscriptionId,
        });

        if (!existingSubscription) {
          console.log(`Subscription ${session.subscriptionId} not found`);
          return NextResponse.json(
            {
              success: true,
              message: 'Subscription not found',
            },
            { status: 200 }
          );
        }

        await handleSubscriptionUpdated({
          subscription: existingSubscription,
          session,
        });

        console.log(`Successfully processed subscription update for ${session.subscriptionId}`);
        break;
      }

      case PaymentEventType.SUBSCRIBE_CANCELED: {
        // Handle subscription cancellation
        if (!session.subscriptionId || !session.subscriptionInfo) {
          return NextResponse.json(
            {
              success: false,
              message: 'Subscription ID or info not found',
            },
            { status: 400 }
          );
        }

        const existingSubscription = await findSubscriptionByProviderSubscriptionId({
          provider,
          subscriptionId: session.subscriptionId,
        });

        if (!existingSubscription) {
          console.log(`Subscription ${session.subscriptionId} not found`);
          return NextResponse.json(
            {
              success: true,
              message: 'Subscription not found',
            },
            { status: 200 }
          );
        }

        await handleSubscriptionCanceled({
          subscription: existingSubscription,
          session,
        });

        console.log(`Successfully processed subscription cancellation for ${session.subscriptionId}`);
        break;
      }

      default: {
        console.log(`Unhandled event type: ${eventType}`);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });

  } catch (_error: any) {
    console.error(`Webhook processing error for provider ${provider}:`, _error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: _error.message,
      },
      { status: 500 }
    );
  }
}

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Detect if this is a renewal payment
 * A payment is a renewal if:
 * 1. The subscription already exists in database
 * 2. It's not the first payment (based on subscription cycle type or transaction check)
 */
function detectRenewal(session: any): boolean {
  // Check subscription cycle type
  const cycleType = session.paymentInfo?.subscriptionCycleType;

  if (cycleType === 'renewal') {
    return true;
  }

  if (cycleType === 'create') {
    return false;
  }

  // Fallback: Check if transaction exists (if no cycle type provided)
  // If transaction ID exists and is new, it's likely a renewal
  return true; // Default to renewal if we can't determine
}