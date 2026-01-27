
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase-admin';
import { initPaymentManager, getPaymentConfigs } from '@/lib/payment/service';
import { createOrder } from '@/lib/models/order';
import type { PaymentOrder } from '@/extensions/payment/types';
import type { Order } from '@/lib/models/order';
import { PaymentStatus } from '@/extensions/payment/types';
import { auth } from '@/auth';

// ==========================================================================
// POST /api/payment/checkout
// Create a checkout session and return the payment URL
// ==========================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();

    const {
      product_id,
      product_name,
      product_description,
      amount,
      currency = 'usd',
      payment_type = 'subscription',
      payment_interval = 'month',
      payment_provider,
      success_url = `${process.env.NEXT_PUBLIC_WEB_URL}/my-success-page`,
      cancel_url = `${process.env.NEXT_PUBLIC_WEB_URL}`,
      metadata = {},
    } = body;

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

    const user_email = session.user.email;
    const user_id = session.user.id;



    // Initialize Supabase client for database operations
    const adminSupabase = await createAdminClient();

    // Check if user already has an active subscription for this product
    const { data: existingOrder } = await adminSupabase
      .from('wmc_order' as any)
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .eq('status', 'paid')
      .single();

    if (existingOrder) {
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

    // Create order data matching the Order interface
    const orderData: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'> = {
      user_id: user_id,
      user_email: user_email,
      product_id: product_id,
      product_name: finalProductName,
      description: product_description,
      amount: finalAmount,
      currency,
      payment_provider: payment_provider,
      payment_type: payment_type,
      payment_interval: payment_interval,
      checkout_info: JSON.stringify({
        product_id,
        product_name: finalProductName,
        success_url,
        cancel_url,
        metadata,
      }),
      status: PaymentStatus.PENDING,
    };

    const order = await createOrder(orderData);

    // Create payment using the provider - convert Order to PaymentOrder
    const paymentOrder: PaymentOrder = {
      orderNo: order.order_no,
      userId: order.user_id,
      userEmail: order.user_email || '',
      productId: order.product_id || '',
      productName: order.product_name || '',
      description: order.description || '',
      amount: order.amount,
      currency: order.currency,
      paymentProvider: order.payment_provider,
      paymentType: order.payment_type as any,
      paymentInterval: order.payment_interval as any,
      successUrl: success_url,
      cancelUrl: cancel_url,
      metadata: metadata,
    };

    // Create payment session using the appropriate provider
    const provider = paymentManager.getProvider(payment_provider);
    const paymentResponse = await provider.createPayment(paymentOrder);

    return NextResponse.json({
      success: true,
      message: 'Checkout session created successfully',
      data: paymentResponse,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}