const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (using anon key for viewing)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRecentRecords() {
  console.log('📊 Checking wmc_processing_history table...\n');
  
  try {
    const { data, error } = await supabase
      .from('wmc_processing_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching data:', error.message);
      return;
    }

    console.log('Recent Records:\n' + '='.repeat(70));
    
    if (!data || data.length === 0) {
      console.log('No records found in wmc_processing_history');
      return;
    }

    data.forEach((record, index) => {
      console.log(`\nRecord #${index + 1}:`);
      console.log(`  ID:         ${record.id}`);
      console.log(`  Created:    ${new Date(record.created_at).toLocaleString()}`);
      console.log(`  Image Size: ${record.image_size} bytes`);
      console.log(`  Success:    ${record.success}`);
      console.log(`  User ID:    ${record.user_id || 'NULL (not logged in)'}`);
      
      // Check IP field
      if (record.ip_address) {
        const ip = record.ip_address;
        const isHashed = /^[a-f0-9]{64}$/.test(ip);
        console.log(`  IP Address: ${ip.substring(0, 40)}...`);
        console.log(`  IP Length:  ${ip.length} characters`);
        console.log(`  Is Hashed:  ${isHashed ? '✅ YES (SHA-256 hash)' : '❌ NO (plain IP!)'}`);
      } else {
        console.log(`  IP Address: NULL (logged in user)`);
      }
      console.log('─'.repeat(70));
    });

    // Summary
    console.log('\n📈 Summary:');
    console.log(`Total records checked: ${data.length}`);
    
    const hashedIPs = data.filter(r => r.ip_address && /^[a-f0-9]{64}$/.test(r.ip_address)).length;
    const plainIPs = data.filter(r => r.ip_address && !/^[a-f0-9]{64}$/.test(r.ip_address)).length;
    const nullIPs = data.filter(r => !r.ip_address).length;
    
    console.log(`  ✅ SHA-256 hashed IPs: ${hashedIPs}`);
    console.log(`  ⚠️  Plain IPs: ${plainIPs}`);
    console.log(`  👤 Logged-in users (NULL): ${nullIPs}`);

    if (plainIPs === 0) {
      console.log('\n🎉 EXCELLENT! All IP addresses are properly anonymized!');
    } else if (plainIPs > 0) {
      console.log(`\n⚠️  WARNING: Found ${plainIPs} records with plain IP addresses!`);
      console.log('   These should be migrated to hashed format.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkRecentRecords();
