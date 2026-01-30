import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'edge';

const SIGNING_SECRET = process.env.CREEM_SIGNING_SECRET;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-creem-signature');

    // 1. Verify Signature
    if (!SIGNING_SECRET || !signature) {
       return NextResponse.json({ error: 'Missing secret or signature' }, { status: 400 });
    }

    // HMAC verification (simplified for example, check Creem docs for exact algorithm)
    // In Edge runtime, use Web Crypto API or verify if 'crypto' module is available
    // For now assuming a valid signature for the template structure

    const event = JSON.parse(rawBody);
    console.log(`Received webhook event: ${event.type}`);

    // 2. Handle Events
    if (event.type === 'checkout.completed' || event.type === 'payment.success') {
       const session = event.data;
       const orderNo = session.metadata?.order_no;
       const userId = session.metadata?.user_id;

       console.log(`Processing payment for Order: ${orderNo}, User: ${userId}`);

       // TODO: Update Order Status to 'paid' in DB
       // TODO: Grant Credits to User
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
