import { NextRequest } from 'next/server';
import { jwtVerify, createLocalJWKSet } from 'jose';

/**
 * Edge Runtime 兼容的会话验证
 * 直接使用 JWT 验证，不依赖 NextAuth 初始化
 */

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!AUTH_SECRET) {
  console.error('Missing AUTH_SECRET environment variable');
}

/**
 * 从请求中获取 token
 */
function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookie = req.headers.get('cookie');
  if (cookie) {
    const sessionTokenMatch = cookie.match(/authjs\.session-token=([^;]+)/);
    if (sessionTokenMatch) {
      return decodeURIComponent(sessionTokenMatch[1]);
    }
  }

  return null;
}

/**
 * 验证会话并返回用户信息
 * 完全兼容 Edge Runtime
 */
export async function verifySession(req: NextRequest) {
  if (!AUTH_SECRET) {
    return { session: null, userId: null, isAuthenticated: false };
  }

  const token = getToken(req);

  if (!token) {
    return { session: null, userId: null, isAuthenticated: false };
  }

  try {
    // JWT 验证（使用 jose 库，Edge Runtime 兼容）
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub) {
      throw new Error('Invalid token: missing sub');
    }

    const userId = payload.sub as string;

    return {
      session: {
        user: {
          id: userId,
          email: payload.email as string,
          name: payload.name as string,
          tier: payload.tier as string,
        }
      },
      userId,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return { session: null, userId: null, isAuthenticated: false };
  }
}
