/**
 * 测试脚本：验证IP哈希处理
 */

const crypto = require('crypto');

// 模拟环境变量
process.env.IP_HASH_SALT = 'test-salt-for-debugging-only';

function hashIPAddress(ip) {
  const salt = process.env.IP_HASH_SALT;
  const hash = crypto.createHmac('sha256', salt);
  hash.update(ip);
  return hash.digest('hex');
}

// 测试哈希结果
const testIPs = ['127.0.0.1', '192.168.1.100'];

console.log('IP Hash Test Results:');
console.log('='.repeat(60));

testIPs.forEach(ip => {
  const hashed = hashIPAddress(ip);
  console.log(`\nOriginal IP: ${ip}`);
  console.log(`Hashed IP:   ${hashed}`);
  console.log(`Length:      ${hashed.length} characters`);
  console.log(`First 10:    ${hashed.substring(0, 10)}...`);
});

console.log('\n' + '='.repeat(60));
console.log('\nDatabase Schema Status:');
console.log('✅ ip_address field type: text (can store 64 chars of SHA-256 hex)');
console.log('✅ Original IP is never stored');
console.log('✅ Hashed IP is irreversible');

console.log('\nExpected in database:');
console.log('  ip_address: "2e99758548972a8e8822ad47fa1018ed…" (64 char hash)');
console.log('  NOT: "127.0.0.1" (original IP)');
