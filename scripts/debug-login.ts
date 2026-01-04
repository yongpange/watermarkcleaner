
import { createAdminClient } from '../src/lib/supabase-admin';
import { storeVerificationCode, verifyCode, generateVerificationCode } from '../src/lib/auth/verification';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugLoginFlow() {
  console.log('🚀 Starting Debug Login Flow...');
  
  const email = 'debug_user_' + Math.floor(Math.random() * 10000) + '@example.com';
  const code = generateVerificationCode();
  const purpose = 'login';
  
  console.log(`👤 Test User: ${email}`);
  console.log(`🔑 Generated Code: ${code}`);
  console.log(`🎯 Purpose: ${purpose}`);
  console.log(`🕒 Client Time: ${new Date().toISOString()}`);

  try {
    // 1. Store Code
    console.log('\n--- Step 1: Storing Code ---');
    const stored = await storeVerificationCode({
      email,
      code,
      purpose,
      expiresInMinutes: 15
    });
    console.log('✅ Code stored result:', stored);

    // 2. Verify Code Immediately
    console.log('\n--- Step 2: Verifying Code (Immediate) ---');
    const result = await verifyCode(email, code, purpose as any);
    
    console.log('🔍 Verification Result:', result);
    
    if (result.valid) {
      console.log('✅ Verification SUCCESS');
    } else {
      console.error('❌ Verification FAILED');
      console.error('   Reason:', result.reason);
      if (result.record) {
          console.log('   Record found:', result.record);
          const expiresAt = new Date(result.record.expires_at);
          const now = new Date();
          console.log('   Expires At:', expiresAt.toISOString());
          console.log('   Now:', now.toISOString());
          console.log('   Diff (ms):', expiresAt.getTime() - now.getTime());
      }
    }

    // 3. Verify Code with Wrong Code
    console.log('\n--- Step 3: Verifying with Wrong Code ---');
    const wrongResult = await verifyCode(email, '000000', purpose as any);
    console.log('🔍 Wrong Code Result (Expect invalid_code):', wrongResult.reason);

  } catch (error) {
    console.error('🚨 Unexpected Error:', error);
  }
}

debugLoginFlow();
