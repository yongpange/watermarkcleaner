import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Debug: Log all environment variables at startup
console.log('[Auth Debug] Starting NextAuth v5...');
console.log('[Auth Debug] NODE_ENV:', process.env.NODE_ENV);
console.log('[Auth Debug] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('[Auth Debug] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
console.log('[Auth Debug] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
console.log('[Auth Debug] AUTH_SECRET:', process.env.AUTH_SECRET ? 'Set' : 'Missing');
console.log('[Auth Debug] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

// NextAuth v5 API - use destructuring to get handlers and auth function
let handlers: any, auth: any, signIn: any, signOut: any;

try {
  const nextAuth = NextAuth(authConfig);
  handlers = nextAuth.handlers;
  auth = nextAuth.auth;
  signIn = nextAuth.signIn;
  signOut = nextAuth.signOut;
  console.log('[Auth Debug] NextAuth initialized successfully');
} catch (error) {
  console.error('[Auth Debug] Failed to initialize NextAuth:', error);
  throw error;
}

// Export handlers for API routes
export { handlers, auth, signIn, signOut };
export const { GET, POST } = handlers;
