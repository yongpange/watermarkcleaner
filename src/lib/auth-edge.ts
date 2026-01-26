import { NextRequest } from 'next/server';
import { jwtVerify, jwtDecrypt } from 'jose';

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
    // try matching secure cookie first, then non-secure
    // authjs v5 uses authjs.session-token, next-auth v4 uses next-auth.session-token
    // we should try to match all possible variants
    const match = cookie.match(/(?:__Secure-)?(?:authjs|next-auth)\.session-token=([^;]+)/);
    
    if (match) {
      console.log('[AuthEdge] Token found in cookie');
      return decodeURIComponent(match[1]);
    } else {
      console.log('[AuthEdge] No session token found in cookie string');
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
    console.error('[AuthEdge] Missing AUTH_SECRET');
    return { session: null, userId: null, isAuthenticated: false };
  }

  // Debug: Log all cookie names to see what we actually received
  const cookieString = req.headers.get('cookie') || '';
  const cookieNames = cookieString.split(';').map(c => c.split('=')[0].trim());
  console.log('[AuthEdge] Received cookies:', cookieNames);

  const token = getToken(req);

  if (!token) {
    console.log('[AuthEdge] No token extraction successful');
    return { session: null, userId: null, isAuthenticated: false };
  }

  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);
    let payload: any;
    
    // 尝试1: JWE Decryption (NextAuth v5 default)
    try {
      // console.log('[AuthEdge] Attempting JWE decryption...');
      const { payload: decrypted } = await jwtDecrypt(token, secret, {
         clockTolerance: 15,
      });
      payload = decrypted;
      console.log('[AuthEdge] JWE Decryption success.');
    } catch (jweError) {
      // console.log('[AuthEdge] JWE failed, trying JWS verify...', (jweError as Error).message);
      // 尝试2: JWS Verification (Legacy or configured for signing only)
      const { payload: verified } = await jwtVerify(token, secret, {
         algorithms: ['HS256', 'RS256'],
         clockTolerance: 15,
      });
      payload = verified;
      console.log('[AuthEdge] JWS Verification success.');
    }

    if (!payload || !payload.sub) {
      console.error('[AuthEdge] Token valid but missing "sub" in payload:', payload ? Object.keys(payload) : 'null');
      throw new Error('Invalid token: missing sub');
    }

    const userId = payload.sub as string;
    console.log('[AuthEdge] Verification success. UserID:', userId);

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
    console.error('[AuthEdge] Session verification failed:', error);
    if (error instanceof Error) {
       console.error('[AuthEdge] Error message:', error.message);
    }
    return { session: null, userId: null, isAuthenticated: false };
  }
}
