
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Replace with your actual auth extraction
import { auth } from '@/auth'; 
// Replace with your actual database/utils
import { createClient } from '@supabase/supabase-js'; 

// ==========================================================================
// CONFIGURATION
// ==========================================================================
const CREEM_API_URL = process.env.CREEM_ENVIRONMENT === 'production' 
  ? 'https://api.creem.io/v1' 
  : 'https://sandbox-api.creem.io/v1';

const CREEM_API_KEY = process.env.CREEM_API_KEY;

// ==========================================================================
// POST /api/payment/checkout
// ==========================================================================
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const {
      product_id,
      amount,
      currency = 'usd',
      success_url = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancel_url = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
    } = body;

    // 1. Create Order in DB (Pending)
    // implementation depends on your DB client...
    const orderNo = `ORD-${Date.now()}`; 
    console.log(`Creating order ${orderNo} for user ${session.user.id}`);

    // 2. Call Creem API
    const response = await fetch(`${CREEM_API_URL}/payments/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY!,
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        product_id: product_id,
        success_url: success_url,
        cancel_url: cancel_url,
        customer: {
          email: session.user.email,
          external_id: session.user.id,
        },
        metadata: {
          order_no: orderNo,
          user_id: session.user.id
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
    }

    return NextResponse.json({
      success: true,
      data: {
        checkout_url: data.checkout_url,
        session_id: data.id
      },
    });

  } catch (error: any) {
    console.error('Checkout failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
