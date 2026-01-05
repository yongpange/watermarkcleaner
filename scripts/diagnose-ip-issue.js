/**
 * 诊断脚本：检测 IPv4/IPv6 问题导致的额度不更新
 *
 * 使用方法：
 *   1. 在项目根目录运行：node scripts\diagnose-ip-issue.js
 *   2. 同时访问 http://localhost:3000/convert
 *   3. 比较两个地方的 IP 地址是否一致
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 加载 .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvLocal();

// 配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IP_HASH_SALT = process.env.IP_HASH_SALT;

// 测试的 IP 地址
const TEST_IPS = {
  ipv4_localhost: '127.0.0.1',
  ipv6_localhost: '::1',
  ipv4_common: '192.168.1.100',
  ipv6_common: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
};

console.log('🔍 IP Address Issue Diagnostic Tool');
console.log('=' .repeat(60));

// 1. 显示环境配置
console.log('\n1. Environment Configuration:');
console.log('-'.repeat(60));
console.log('IP_HASH_SALT:', IP_HASH_SALT ? '✅ Present' : '❌ Missing');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Present' : '❌ Missing');

// 2. 显示不同 localhost 的哈希
console.log('\n2. Localhost IP Address Variants:');
console.log('-'.repeat(60));

const hashIP = (ip) => {
  const hash = crypto.createHmac('sha256', IP_HASH_SALT);
  hash.update(ip);
  return hash.digest('hex');
};

for (const [name, ip] of Object.entries(TEST_IPS)) {
  const hashed = hashIP(ip);
  console.log(`\n${name}:`);
  console.log(`  Value: ${ip}`);
  console.log(`  Hashed: ${hashed}`);
  console.log(`  First 16 chars: ${hashed.substring(0, 16)}...`);
}

console.log('\n💡 注意：这些哈希完全不同！');
console.log('   这就是为什么额度不更新的原因：');
console.log('   - 浏览器访问用 ::1 (IPv6)');
console.log('   - 之前记录用 127.0.0.1 (IPv4)');
console.log('   - 系统认为这是两个不同的用户');

// 3. 查询数据库中的所有 localhost 记录
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  console.log('\n3. Database Query - All localhost records:');
  console.log('-'.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const localhostHashes = Object.values(TEST_IPS).map(ip => hashIP(ip));

  console.log('Searching for these hashes in database:');
  localhostHashes.forEach((hash, i) => {
    console.log(`  ${i + 1}. ${hash.substring(0, 16)}...`);
  });

  // 查询所有这些 IP 哈希的记录
  const { data: records, error } = await supabase
    .from('wmc_processing_history')
    .select('*')
    .in('ip_address', localhostHashes)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying database:', error.message);
  } else if (records && records.length > 0) {
    console.log(`\nFound ${records.length} localhost-related records:\n`);

    records.forEach((record, index) => {
      const matchedIP = Object.entries(TEST_IPS).find(([_, ip]) => hashIP(ip) === record.ip_address);
      const ipType = matchedIP ? matchedIP[0] : 'Unknown IP variant';
      const originalIP = matchedIP ? matchedIP[1] : 'unknown';

      console.log(`Record ${index + 1}:`);
      console.log(`  Database IP type: ${ipType}`);
      console.log(`  Original IP: ${originalIP}`);
      console.log(`  Hash: ${record.ip_address.substring(0, 16)}...`);
      console.log(`  Created: ${new Date(record.created_at).toLocaleString()}`);
      console.log('');
    });

    // 按 IP 类型统计
    const stats = {};
    records.forEach(record => {
      const matchedIP = Object.entries(TEST_IPS).find(([_, ip]) => hashIP(ip) === record.ip_address);
      const ipType = matchedIP ? matchedIP[0] : 'other';
      stats[ipType] = (stats[ipType] || 0) + 1;
    });

    console.log('Usage by IP type:');
    for (const [type, count] of Object.entries(stats)) {
      console.log(`  ${type}: ${count}`);
    }

    // 4. 显示解决方案
    console.log('\n4. Solutions:');
    console.log('-'.repeat(60));
    console.log('✅ 推荐方案 A：统一使用 IPv4 localhost');
    console.log('   访问 http://127.0.0.1:3000/convert 而不是 http://localhost:3000/convert');
    console.log('');
    console.log('✅ 推荐方案 B：在代码中标准化 IP');
    console.log('   修改 getClientIP 函数，统一 localhost 表示');
    console.log('');
    console.log('✅ 推荐方案 C：同时查询 IPv4 和 IPv6');
    console.log('   在额度检查时，同时查询两种 localhost 的哈希');
    console.log('');

  } else {
    console.log('\n❌ No localhost-related records found in database.');
    console.log('   Possible causes:');
    console.log('   - No images processed yet');
    console.log('   - Records are from external IPs (not localhost)');
    console.log('   - Database connection issue');
  }
}

// 5. 快速解决方案
console.log('\n5. Quick Fix:');
console.log('-'.repeat(60));
console.log('Use this URL for development:');
console.log('  🌐 http://127.0.0.1:3000/convert');
console.log('');
console.log('NOT this URL:');
console.log('  ❌ http://localhost:3000/convert');
console.log('  ❌ http://[::1]:3000/convert');
console.log('');

console.log('='.repeat(60));
console.log('Diagnostics completed!');
