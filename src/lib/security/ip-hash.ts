import crypto from 'crypto';

/**
 * IP哈希处理工具
 * 用于匿名化IP地址，保护用户隐私
 */

// 从环境变量获取盐值（如果不存在则生成随机盐值，但记录警告）
let IP_HASH_SALT = process.env.IP_HASH_SALT as string;

if (!IP_HASH_SALT) {
  console.warn('⚠️  WARNING: IP_HASH_SALT not found in environment variables!');
  console.warn('   This will cause inconsistent IP hashing across server restarts.');
  console.warn('   Generate a stable salt with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');

  // 仅在首次未设置时生成，存储在模块变量中（不会随热重载改变）
  const generatedSalt = crypto.randomBytes(32).toString('hex');
  console.warn(`   Generated temporary salt: ${generatedSalt.substring(0, 20)}...`);
  console.warn('   Add this to your .env.local file to make it persistent.');

  IP_HASH_SALT = generatedSalt;
} else {
  // 验证盐值格式
  if (!/^[a-f0-9]{64}$/.test(IP_HASH_SALT)) {
    console.warn('⚠️  WARNING: IP_HASH_SALT should be a 64-character hex string (32 bytes)');
    console.warn(`   Current value: ${IP_HASH_SALT} (length: ${IP_HASH_SALT.length})`);
    console.warn('   Expected format: 1f8b83c74037ae6b2d473c1f2ffd4d070a0f335431c938216a71fec88e68dcd3');
  }

  // 盐值已设置，记录调试信息（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 IP_HASH_SALT loaded: ${IP_HASH_SALT.substring(0, 10)}...`);
  }
}

// 缓存哈希实例以提高性能
const hashCache = new Map<string, string>();
const CACHE_MAX_SIZE = 10000;

/**
 * 对IP地址进行加盐哈希处理
 * @param ip - 原始IP地址
 * @returns 哈希后的IP标识符
 */
export function hashIPAddress(ip: string): string {
  if (!ip || ip === 'unknown-ip') {
    return 'unknown';
  }

  // 检查缓存
  if (hashCache.has(ip)) {
    return hashCache.get(ip)!;
  }

  // 创建SHA-256哈希
  const hash = crypto.createHmac('sha256', IP_HASH_SALT);
  hash.update(ip);
  const hashedIP = hash.digest('hex');

  // 存储到缓存（LRU策略）
  if (hashCache.size >= CACHE_MAX_SIZE) {
    // 删除最老的条目
    const iterator = hashCache.keys();
    const firstKey = iterator.next().value;
    if (firstKey) {
      hashCache.delete(firstKey);
    }
  }
  hashCache.set(ip, hashedIP);

  return hashedIP;
}

/**
 * 验证IP地址格式
 * @param ip - IP地址字符串
 * @returns 是否有效的IP地址
 */
export function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown-ip') return false;

  // IPv4正则
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6正则（简化版）
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}([0-9a-fA-F]{0,4})?$/;
  return ipv6Regex.test(ip);
}

/**
 * 获取客户端IP地址
 * @param request - Next.js请求对象
 * @returns 客户端IP地址
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;

  // 按优先级获取真实IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for可能包含多个IP，取第一个
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // 如果获取不到，返回unknown
  return 'unknown-ip';
}
