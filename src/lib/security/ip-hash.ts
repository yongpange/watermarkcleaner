// Removed Node.js crypto import to be Edge compatible
// import crypto from 'crypto';

/**
 * IP哈希处理工具
 * 用于匿名化IP地址，保护用户隐私
 */

// 从环境变量获取盐值（如果不存在则生成随机盐值，但记录警告）
let IP_HASH_SALT = process.env.IP_HASH_SALT as string;

// Helper to convert hex to buffer
// Helper to convert hex to buffer (unused)
// function _hexToBuf(hex: string): Uint8Array {
//   const bytes = new Uint8Array(Math.ceil(hex.length / 2));
//   for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
//   return bytes;
// }

// Helper to convert buffer to hex
function bufToHex(buf: Uint8Array | ArrayBuffer): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

if (!IP_HASH_SALT) {
  console.warn('⚠️  WARNING: IP_HASH_SALT not found in environment variables!');
  // Generate random salt using Web Crypto
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  const generatedSalt = bufToHex(randomValues);
  
  console.warn(`   Generated temporary salt: ${generatedSalt.substring(0, 20)}...`);
  IP_HASH_SALT = generatedSalt;
}

// 缓存哈希实例以提高性能
const hashCache = new Map<string, string>();
const CACHE_MAX_SIZE = 10000;

/**
 * 对IP地址进行加盐哈希处理
 * @param ip - 原始IP地址
 * @returns 哈希后的IP标识符
 */
export async function hashIPAddress(ip: string): Promise<string> {
  if (!ip || ip === 'unknown-ip') {
    return 'unknown';
  }

  // 检查缓存
  if (hashCache.has(ip)) {
    return hashCache.get(ip)!;
  }

  // 使用 Web Crypto API 进行 HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(IP_HASH_SALT);
  const data = encoder.encode(ip);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashedIP = bufToHex(signature);

  // 存储到缓存（LRU策略）
  if (hashCache.size >= CACHE_MAX_SIZE) {
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
