
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { handleCheckoutSuccess } from '@/lib/payment/service';
import { PaymentStatus } from '@/extensions/payment/types';

/**
 * Debug endpoint to manually trigger payment success logic
 * Usage: /api/debug/payment-success?order_no=ORD-xxxx
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const orderNo = searchParams.get('order_no');

  if (!orderNo) {
    return NextResponse.json({ error: 'Missing order_no' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    
    // 1. Fetch the order
    const { data: order, error } = await supabase
      .from('wmc_order')
      .select('*')
      .eq('order_no', orderNo)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[Debug] Forcing success for order: ${orderNo}`);

    // 2. Mock a payment session
    const mockSession = {
      sessionId: `mock_session_${Date.now()}`,
      status: 'paid',
      amount: order.amount,
      currency: order.currency,
      paymentInfo: {
        paymentId: `mock_pay_${Date.now()}`,
        transactionId: `mock_txn_${Date.now()}`,
        paidAt: new Date(),
        paymentMethod: 'debug_tool',
      },
      // If it's a subscription, mock subscription info
      subscriptionInfo: order.payment_type === 'subscription' ? {
        subscriptionId: `sub_mock_${Date.now()}`,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      } : undefined,
      metadata: {
        order_no: orderNo
      }
    };

    // 3. Call the actual business logic
    // We cast to any because the order type from Supabase might slightly differ from the strict Order interface
    // but the fields we care about are the same.
    await handleCheckoutSuccess({ 
      order: order as any, 
      session: mockSession as any 
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed order ${orderNo}`,
      credits_granted: order.credits_amount,
      new_status: 'paid'
    });

  } catch (error: any) {
    console.error('[Debug] Failed to force payment success:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
