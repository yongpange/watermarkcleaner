
import { createAdminClient } from '../src/lib/supabase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugInsert() {
  const email = 'debug_test_' + Date.now() + '@example.com';
  const code = '123456';
  const purpose = 'login';
  const supabase = createAdminClient();

  console.log('1. Starting Debug Insert for:', email);
  console.log('   Current Client Time:', new Date().toISOString());

  // Simulate storeVerificationCode
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const insertPayload = {
    email,
    code,
    purpose,
    expires_at: expiresAt.toISOString(),
    // NOT sending created_at, relying on DB default
  };

  console.log('2. Inserting payload:', insertPayload);

  const { data: insertData, error: insertError } = await supabase
    .from('wmc_email_verification_codes')
    .insert(insertPayload as any)
    .select()
    .single(); // .select().single() returns the inserted row

  if (insertError) {
    console.error('❌ Insert failed:', insertError);
    return;
  }

  console.log('✅ Insert successful. Returned row:', insertData);
  
  if (!insertData.created_at) {
    console.error('🚨 CRITICAL: created_at is MISSING/NULL in the inserted record!');
  } else {
    console.log('   created_at from DB:', insertData.created_at);
    
    // Check sort order
    console.log('3. Verifying sort order...');
    const { data: queryData, error: queryError } = await supabase
        .from('wmc_email_verification_codes')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);
        
    if (queryError) {
        console.error('❌ Query failed:', queryError);
    } else {
        console.log('   Query result:', queryData);
        if (queryData && queryData.length > 0 && queryData[0].code === code) {
            console.log('✅ Query found the correct record using created_at sort.');
        } else {
            console.error('🚨 Query did NOT find the record or found wrong one.');
        }
    }
  }
}

debugInsert();
