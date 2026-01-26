import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const envCheck = {
    runtime: 'edge', // verifying this file runs in edge
    timestamp: new Date().toISOString(),
    vars: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'undefined',
      NODE_ENV: process.env.NODE_ENV,
    }
  };
  
  return NextResponse.json(envCheck);
}
