import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Create the NextAuth handler
const handler = NextAuth(authConfig);

// Export handlers for both GET and POST requests
export { handler as GET, handler as POST };