import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth.config';

// NextAuth v5 新 API
export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
