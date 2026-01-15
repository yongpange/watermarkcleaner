import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// NextAuth v5 API - use destructuring to get handlers and auth function
const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export handlers for API routes
export { handlers };
export const { GET, POST } = handlers;

// Export auth function for use in server components and API routes
export { auth, signIn, signOut };
