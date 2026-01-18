import { NextRequest, NextResponse } from 'next/server';
import { initPaymentManager, getPaymentConfigs } from '@/lib/payment/service';
import { createOrder, isOrderPaid } from '@/lib/models/order';
import type { PaymentOrder } from '@/extensions/payment/types';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase-admin';

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

    // Get user session - 支持 NextAuth 和 Supabase Auth
    let user_email: string | null = null;
    let user_id: string | null = null;

    // 1. 尝试获取 NextAuth session (Google OAuth)
    const nextAuthSession = await auth();
    if (nextAuthSession?.user) {
      user_email = nextAuthSession.user.email;
      user_id = nextAuthSession.user.id;
    } else {
      // 2. 没有 NextAuth session，尝试 Supabase Auth
      const supabaseClient = createClient();
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        user_email = session.user.email;
        user_id = session.user.id;
      }
    }

    if (!user_email || !user_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const user = { email: user_email, id: user_id };

    // Initialize Supabase client for database operations
    const adminSupabase = createClient();

    // Check if user already has an active subscription for this product
    const { data: existingOrder } = await adminSupabase
      .from('wmc_order')
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
    const paymentManager = initPaymentManager(payment_provider, paymentConfigs);

    // Create order
    const orderData: PaymentOrder = {
      user_id: user_id,
      user_email: user_email,
      product_id,
      product_name: finalProductName,
      product_description,
      amount: finalAmount,
      currency,
      payment_type,
      payment_interval,
      payment_provider,
      success_url,
      cancel_url,
      metadata,
    };

    const order = await createOrder(orderData);

    // Create payment session
    const paymentResponse = await paymentManager.createCheckoutSession({
      order,
      success_url,
      cancel_url,
    });

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