require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyPaymentSetup() {
  console.log('🔍 Verifying Payment System Setup...\n');

  const tablesToCheck = [
    'wmc_order', // This one might be named differently? wmc_credit/wmc_subscription are standard.
    // wait, I saw wmc_order used in service.ts, but update-credit-system-20260117.sql creates wmc_credit and wmc_subscription.
    // Let me double check update-credit-system-20260117.sql for wmc_order.
    // It DOES NOT create wmc_order. It creates wmc_credit, wmc_subscription, wmc_config.
    // service.ts imports createOrder from '@/lib/models/order'.
    // I need to check where wmc_order is defined.
    // But for now let's check what we know.
    'wmc_credit',
    'wmc_subscription',
    'wmc_config'
  ];

  let missingTables = [];

  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') { // undefined_table
      console.log(`❌ Table '${table}' is MISSING.`);
      missingTables.push(table);
    } else if (error) {
      console.log(`⚠️  Error checking '${table}':`, error.message);
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }

  // Also check for wmc_order specially to see if it exists
  const { error: orderError } = await supabase.from('wmc_order').select('count', { count: 'exact', head: true });
  if (orderError && orderError.code === '42P01') {
      console.log(`❌ Table 'wmc_order' is MISSING.`);
      missingTables.push('wmc_order');
  } else if (!orderError) {
      console.log(`✅ Table 'wmc_order' exists.`);
  }


  console.log('\n📊 Summary:');
  if (missingTables.length > 0) {
    console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    console.log('💡 Recommendation: Run "scripts/update-credit-system-20260117.sql" in Supabase SQL Editor.');
  } else {
    console.log('✅ All payment system tables are present.');
  }
}

verifyPaymentSetup();
