import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';

export const runtime = 'edge';

export async function GET() {
  const envCheck: any = {
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
    },
    tests: {}
  };

  // Test 1: Supabase Initialization & Connection
  try {
    const supabase = createAdminClient();
    // Try a lightweight query - count users or similar, or just check URL
    // We can just check if keys are valid by making a simple request that requires auth
    // accessing a non-existent table is fine, it checks connection
    const { error } = await supabase.from('wmc_users').select('*', { count: 'exact', head: true });
    
    envCheck.tests.supabase = {
      success: !error,
      error: error ? error.message : null,
      details: error
    };
  } catch (e: any) {
    envCheck.tests.supabase = {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }

  // Test 2: Resend Initialization (just check constructor)
  try {
    new Resend(process.env.RESEND_API_KEY || 're_placeholder');
    envCheck.tests.resend = {
      success: true,
      result: 'Initialized'
    };
  } catch (e: any) {
    envCheck.tests.resend = {
      success: false,
      error: e.message
    };
  }
  
  return NextResponse.json(envCheck);
}
