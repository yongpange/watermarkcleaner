import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// NextAuth handler
const handler = NextAuth(authConfig);

// Export auth function for use in server components and API routes
export const auth = handler.auth;

// Export for use in API routes
export { handler as GET, handler as POST };
export default handler;
