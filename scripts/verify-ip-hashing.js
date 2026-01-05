/**
 * 验证脚本：检查 IP 哈希一致性
 * 使用方法：
 *   node scripts/verify-ip-hashing.js
 *
 * 这个脚本会：
 * 1. 验证环境变量中的 IP_HASH_SALT
 * 2. 测试同一个 IP 的哈希是否一致
 * 3. 检查数据库中的记录
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 加载 .env.local 文件
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (fs.existsSync(envPath)) {
    console.log('📄 Loading .env.local file...');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');

    for (const line of envLines) {
      // Skip comments and empty lines
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
          process.env[key.trim()] = value;
          if (key.trim() === 'IP_HASH_SALT') {
            console.log(`✅ Found IP_HASH_SALT: ${value.substring(0, 20)}...`);
          }
        }
      }
    }
  } else {
    console.log('⚠️  Warning: .env.local file not found at', envPath);
  }
}

// 加载环境变量
loadEnvLocal();

// Supabase 配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('🔍 IP Hashing Verification Tool');
  console.log('='.repeat(60));

  // 1. 检查环境变量
  console.log('\n1. Environment Variables:');
  console.log('-'.repeat(60));

  const salt = process.env.IP_HASH_SALT;
  console.log('IP_HASH_SALT present:', !!salt);

  if (!salt) {
    console.error('❌ IP_HASH_SALT not found!');
    console.error('   Add this to your .env.local file:');
    console.error('   IP_HASH_SALT="' + crypto.randomBytes(32).toString('hex') + '"');
    process.exit(1);
  }

  console.log('IP_HASH_SALT value:', salt);
  console.log('IP_HASH_SALT length:', salt.length, 'chars (expected: 64)');

  if (salt.length !== 64) {
    console.warn('⚠️  WARNING: Salt should be 64 characters (32 bytes hex)');
  }

  // 2. 测试 IP 哈希一致性
  console.log('\n2. IP Hashing Consistency Test:');
  console.log('-'.repeat(60));

  const testIPs = ['127.0.0.1', '192.168.1.1', '8.8.8.8'];

  testIPs.forEach(ip => {
    const hash1 = hashIP(ip, salt);
    const hash2 = hashIP(ip, salt);
    const hash3 = hashIP(ip, salt);

    console.log(`\nIP: ${ip}`);
    console.log(`  Hash 1: ${hash1}`);
    console.log(`  Hash 2: ${hash2}`);
    console.log(`  Hash 3: ${hash3}`);

    const consistent = hash1 === hash2 && hash2 === hash3;
    console.log(`  Consistent: ${consistent ? '✅ YES' : '❌ NO'}`);

    if (!consistent) {
      console.error('❌ ERROR: Hashes should be identical!');
      process.exit(1);
    }
  });

  // 3. 检查数据库记录
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    console.log('\n3. Database Records:');
    console.log('-'.repeat(60));

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // 测试查询：获取最新的 5 条记录
      const { data: records, error } = await supabase
        .from('wmc_processing_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error querying database:', error.message);
      } else if (records && records.length > 0) {
        console.log(`Found ${records.length} recent records:\n`);

        records.forEach((record, index) => {
          console.log(`Record ${index + 1}:`);
          console.log(`  ID: ${record.id}`);
          console.log(`  User ID: ${record.user_id || 'NULL (guest)'}`);
          console.log(`  IP Hash: ${record.ip_address || 'NULL (authenticated)'}`);
          console.log(`  Image Size: ${record.image_size ? (record.image_size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
          console.log(`  Success: ${record.success}`);
          console.log(`  Created: ${new Date(record.created_at).toLocaleString()}`);
          console.log('');
        });

        // 统计 IP 哈希使用情况
        const { count: ipRecords, error: countError } = await supabase
          .from('wmc_processing_history')
          .select('*', { count: 'exact', head: true })
          .not('ip_address', 'is', null);

        if (!countError) {
          console.log(`Total guest records (IP-based): ${ipRecords}`);
        }
      } else {
        console.log('No records found in wmc_processing_history table.');
      }
    } catch (error) {
      console.error('❌ Database connection error:', error.message);
    }
  } else {
    console.log('Supabase credentials not found, skipping database check.');
  }

  // 4. Summary
  console.log('\n4. Summary:');
  console.log('-'.repeat(60));
  console.log('✅ IP_HASH_SALT is configured');
  console.log('✅ Hashing is consistent');
  console.log('✅ All tests passed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Restart your Next.js dev server');
  console.log('   2. Check browser console for "🔑 IP_HASH_SALT loaded" message');
  console.log('   3. Process an image and check the logs');
  console.log('   4. Verify database records with IP hashes');
}

function hashIP(ip, salt) {
  const hash = crypto.createHmac('sha256', salt);
  hash.update(ip);
  return hash.digest('hex');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { hashIP };
