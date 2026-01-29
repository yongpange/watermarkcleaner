
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
// export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase-admin';
import { initPaymentManager, getPaymentConfigs } from '@/lib/payment/service';
import { generateSnowId } from '@/lib/utils';
import type { PaymentOrder } from '@/extensions/payment/types';
import type { Order } from '@/lib/models/order';
import { PaymentStatus } from '@/extensions/payment/types';
import { auth } from '@/auth';
import { PRODUCT_CONFIG, type ProductId } from '@/lib/credits/config';

// ==========================================================================
// POST /api/payment/checkout
// Create a checkout session and return the payment URL
// ==========================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  let currentProvider = 'unknown';
  try {
    // Parse request body
    const body = await request.json();

    // Get user session - 仅使用 NextAuth (纯 NextAuth + Supabase 数据库)
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const {
      product_id,
      product_name,
      product_description,
      amount,
      currency = 'usd',
      payment_type = 'subscription',
      payment_interval = 'month',
      payment_provider, // extracted inside try block
      success_url = `${process.env.NEXT_PUBLIC_WEB_URL}/payment/success`,
      cancel_url = `${process.env.NEXT_PUBLIC_WEB_URL}/payment/cancel`,
      metadata = {},
      locale,
    } = body;

    // Capture provider for error logging
    currentProvider = payment_provider;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: product_id',
        },
        { status: 400 }
      );
    }

    // 使用 product_id 作为 product_name 的备用值
    const finalProductName = product_name || product_id;
    const finalAmount = amount || 0; // Free 计划金额为 0

    // Handle Free Plan (Amount 0)
    if (finalAmount === 0 || product_id === 'free-plan') {
       console.log('Processing free plan request:', { product_id, user: session.user.email });
       // Skip payment provider and return success immediately
       return NextResponse.json({
         success: true,
         message: 'Free plan activated successfully',
         data: {
            checkoutUrl: success_url + '?session_id=free_plan_' + Date.now(),
            sessionId: 'free_plan_' + Date.now()
         },
       });
    }

    const user_email = session.user.email;
    const user_id = session.user.id;



    // Initialize Supabase client for database operations
    const adminSupabase = await createAdminClient();

    // Check if user already has an active subscription for this product
    // Check if user already has an active subscription for this product
    // We check for 'active', 'trialing', or 'past_due' status in wmc_subscription
    const { data: existingSubscription } = await adminSupabase
      .from('wmc_subscription' as any)
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .in('status', ['active', 'trialing', 'past_due'])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active subscription for this product',
          code: 'ALREADY_SUBSCRIBED',
        },
        { status: 400 }
      );
    }

    // Get payment configurations
    const paymentConfigs = await getPaymentConfigs();

    // Initialize payment manager
    const paymentManager = await initPaymentManager(payment_provider, paymentConfigs);
    
    // Ensure we have a valid provider name (use default if not specified)
    const effectiveProvider = payment_provider || paymentManager.defaultProvider;
    
    if (!effectiveProvider) {
        throw new Error('No payment provider available');
    }

    // Get product configuration for credits
    const productConfig = PRODUCT_CONFIG[product_id as ProductId];
    const creditsAmount = productConfig?.credits || 0;
    const creditsValidDays = productConfig?.validDays || 30; // Default 30 days
    
    console.log(`[Checkout] Product: ${product_id}, Credits: ${creditsAmount}, ValidDays: ${creditsValidDays}`);

    // Create order data matching the Order interface
    const orderData: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'> = {
      user_id: user_id,
      user_email: user_email,
      product_id: product_id,
      product_name: finalProductName,
      description: product_description,
      amount: finalAmount,
      currency,
      payment_provider: effectiveProvider,
      payment_type: payment_type,
      payment_interval: payment_interval,
      credits_amount: creditsAmount,           // ✅ Add credits amount from config
      credits_valid_days: creditsValidDays,    // ✅ Add credits valid days from config
      checkout_info: JSON.stringify({
        product_id,
        product_name: finalProductName,
        success_url,
        cancel_url,
        metadata,
      }),
      status: PaymentStatus.PENDING,
    };
    
    // Debug: Log the exact payload we are trying to insert
    const orderNo = `ORD-${generateSnowId()}`;
    const insertPayload = {
        ...orderData,
        order_no: orderNo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    console.log('[Checkout] Inserting order payload:', JSON.stringify(insertPayload, null, 2));

    // Use admin client to create order directly (bypassing RLS issues)
    const { data: order, error: createError } = await adminSupabase
      .from('wmc_order')
      .insert([insertPayload])
      .select()
      .single();

    if (createError) {
       console.error('[Checkout] Database insert FAILED.');
       // Log full error details in multiple formats to ensure we catch it
       console.error('Error object keys:', Object.keys(createError));
       console.error('Error stringified:', JSON.stringify(createError, null, 2));
       console.error('Error code:', createError.code);
       console.error('Error message:', createError.message);
       console.error('Error details:', createError.details);
       console.error('Error hint:', createError.hint);
       
       throw new Error(`Failed to create order: ${createError.message || JSON.stringify(createError)}`);
    }

    const createdOrder = order as any;

    // Create payment using the provider - convert Order to PaymentOrder
    const paymentOrder: PaymentOrder = {
      orderNo: createdOrder.order_no,
      userId: createdOrder.user_id,
      userEmail: createdOrder.user_email || '',
      productId: createdOrder.product_id || '',
      productName: createdOrder.product_name || '',
      description: createdOrder.description || '',
      amount: createdOrder.amount,
      currency: createdOrder.currency,
      paymentProvider: createdOrder.payment_provider,
      paymentType: createdOrder.payment_type as any,
      paymentInterval: createdOrder.payment_interval as any,
      successUrl: success_url,
      cancelUrl: cancel_url,
      locale: locale,
      metadata: metadata,
    };

    // Create payment session using the appropriate provider
    const provider = paymentManager.getProvider(effectiveProvider);
    const paymentResponse = await provider.createPayment(paymentOrder);

    return NextResponse.json({
      success: true,
      message: 'Checkout session created successfully',
      data: paymentResponse,
    });
  } catch (error: any) {
    console.error('Create checkout failed:', {
      message: error?.message,
      stack: error?.stack,
      provider: currentProvider,
    });
    
    // Check for specific provider errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}