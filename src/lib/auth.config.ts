import EmailProvider from 'next-auth/providers/email';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import type { Adapter } from 'next-auth/adapters';

/**
 * NextAuth.js configuration for email-based authentication
 *
 * Features:
 * - Email verification with magic links
 * - Supabase database adapter
 * - Custom session callbacks to include user data
 */

export const authOptions = {
  // Use Supabase adapter for database operations
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as Adapter,

  // Configure authentication providers
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || 'noreply@watermarkcleaner.com',

      // Custom sendVerificationRequest for Resend API
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          const { error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'WatermarkCleaner <noreply@watermarkcleaner.com>',
            to: email,
            subject: '验证您的邮箱 - 获得更多图片去水印额度',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">验证您的邮箱</h1>
                <p>您好！</p>
                <p>感谢您使用 WatermarkCleaner。请点击下面的链接验证您的邮箱地址：</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">验证邮箱地址</a>
                </div>
                <p>验证后，您每月的图片去水印额度将从 <strong>3张</strong> 增加到 <strong>10张</strong>！</p>
                <p style="color: #666; font-size: 14px;">如果这不是您的操作，请忽略此邮件。</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">WatermarkCleaner - 智能AI去水印工具</p>
              </div>
            `,
          });

          if (error) {
            throw new Error(error.message);
          }
        } catch (error) {
          console.error('Failed to send verification email:', error);
          throw new Error('Failed to send verification email');
        }
      },
    }),
  ],

  // Custom page routes
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  // Session strategy
  session: {
    strategy: 'database' as const,
  },

  // Callbacks to customize behavior
  callbacks: {
    // Include user data in session
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        // Add custom fields from User model
        session.user.id = user.id;
        session.user.tier = user.tier;
        session.user.creditsUsed = user.creditsUsed;
      }
      return session;
    },

    // Handle user creation/updates
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      console.log('User signed in:', user.email, 'ID:', user.id);
      return true;
    },
  },

  // Event handlers
  events: {
    async createUser({ user }: { user: any }) {
      console.log('New user created:', user.email, 'ID:', user.id);
    },
    async signIn({ user }: { user: any }) {
      console.log('User signed in:', user.email, 'ID:', user.id);
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};
