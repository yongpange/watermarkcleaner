
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// -- Configuration --
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IP_HASH_SALT = process.env.IP_HASH_SALT;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Log salt status (don't log the actual secret)
console.log(`ℹ️  IP_HASH_SALT is ${IP_HASH_SALT ? 'set' : 'NOT SET (using random)'}`);

// -- Helpers --

// Re-implement hash logic to ensure it matches server logic exactly
function hashIPAddress(ip: string): string {
  const salt = IP_HASH_SALT || ''; 
  // Note: If salt is missing in env, server generates a random one on startup.
  // This script will fail to match server hash if salt is not in env, 
  // because server's random salt is in memory.
  // BUT the app's CLAUDE.md implies IP_HASH_SALT is an env var.
  
  if (!salt) {
      console.warn("⚠️  WARNING: IP_HASH_SALT not found in env. Hashes will not match server if server uses random salt.");
  }

  const hash = crypto.createHmac('sha256', salt);
  hash.update(ip);
  return hash.digest('hex');
}

async function runTest() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  
  // 1. Simulate a Test IP
  const testIP = '111.222.333.444'; // A distinct test IP
  const hashedIP = hashIPAddress(testIP);
  
  console.log('\n--- 🧪 Guest Usage Test Started ---');
  console.log(`Test IP: ${testIP}`);
  console.log(`Hashed IP: ${hashedIP}`);

  // 2. Get Current Usage (Start of Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: initialCount, error: countError } = await supabase
    .from('wmc_processing_history')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', hashedIP)
    .gte('created_at', startOfMonth)
    .eq('success', true);

  if (countError) {
    console.error('❌ Failed to query initial count:', countError);
    return;
  }

  console.log(`\n📊 Initial Usage: ${initialCount} / 3`);

  // 3. Simulate Processing (Insert Record)
  console.log('\n🔄 Simulating Image Processing...');
  
  const { error: insertError } = await supabase
    .from('wmc_processing_history')
    .insert({
      user_id: null, // Guest
      ip_address: hashedIP,
      image_size: 1024 * 500, // 500KB
      success: true,
      created_at: new Date().toISOString()
    });

  if (insertError) {
    console.error('❌ Failed to insert record:', insertError);
    return;
  }
  console.log('✅ Record inserted successfully directly to DB.');

  // 4. Verify New Usage Count
  const { count: finalCount, error: finalCountError } = await supabase
    .from('wmc_processing_history')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', hashedIP)
    .gte('created_at', startOfMonth)
    .eq('success', true);

  if (finalCountError) {
    console.error('❌ Failed to query final count:', finalCountError);
    return;
  }

  console.log(`\n📊 Final Usage: ${finalCount} / 3`);

  // 5. Result
  if (finalCount === (initialCount || 0) + 1) {
    console.log('\n✨ SUCCESS: Usage count incremented correctly.');
    console.log(`   Remaining Credits: ${Math.max(0, 3 - (finalCount || 0))}`);
  } else {
    console.error('\n❌ FAILURE: Usage count did not increment as expected.');
  }
}

runTest().catch(console.error);
