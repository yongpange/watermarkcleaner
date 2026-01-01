import EmailProvider from 'next-auth/providers/email';
import Credentials from 'next-auth/providers/credentials';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import type { Adapter } from 'next-auth/adapters';
import { createClient } from '@/lib/supabase-server';
import {
  verifyCode,
  markCodeAsUsed,
  type VerifyCodeResult
} from '@/lib/auth/verification';

/**
 * NextAuth.js configuration for email-based authentication
 *
 * Features:
 * - Email verification with magic links
 * - Email verification code (passwordless)
 * - Supabase database adapter
 * - Custom session callbacks to include user data
 */

export const authOptions = {
  // Use Supabase adapter for database operations
  // 注意：表名已经通过重命名解决，这里不需要修改
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as Adapter,

  // Configure authentication providers
  providers: [
    // 邮箱 Magic Link（保持原有功能）
    EmailProvider({
      from: process.env.EMAIL_FROM || 'noreply@watermarkcleaner.com',

      // Custom sendVerificationRequest for Resend API
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          console.log(`📧 开始发送验证邮件到: ${email}`);
          console.log(`🔗 验证链接: ${url}`);

          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          // 由于 watermarkcleaner.com 已验证，可以直接向任意邮箱发送
          const targetEmail = email;

          console.log(`📤 使用 Resend API 发送邮件到: ${targetEmail}`);

          const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'WatermarkCleaner <noreply@watermarkcleaner.com>',
            to: targetEmail,
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

          if (result.error) {
            console.error('❌ Resend API 返回错误:', result.error);
            throw new Error(result.error.message);
          }

          console.log('✅ 验证邮件发送成功！邮件ID:', result.data?.id);
          console.log('📧 邮件已加入发送队列，状态请查看 Resend 控制台');
        } catch (error) {
          console.error('❌ Failed to send verification email:', error);
          throw new Error('Failed to send verification email');
        }
      },
    }),

    // ==================== 新增：邮箱验证码认证 ====================
    Credentials({
      id: 'email-code',
      name: 'Email Verification Code',
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Verification Code", type: "text" },
        purpose: { label: "Purpose", type: "text" }
      },
      async authorize(credentials) {
        console.log('[Credentials] Starting authorization...');

        // 1. 验证输入
        if (!credentials?.email || !credentials?.code || !credentials?.purpose) {
          console.log('[Credentials] Missing credentials');
          return null;
        }

        console.log('[Credentials] Email:', credentials.email, 'Purpose:', credentials.purpose);

        try {
          // 2. 验证验证码（确保安全性）
          const result: VerifyCodeResult = await verifyCode(
            credentials.email,
            credentials.code,
            credentials.purpose as 'register' | 'login' | 'update_email'
          );

          if (!result.valid) {
            console.log('[Credentials] Invalid verification code:', result.reason);
            return null; // 返回 null 表示认证失败
          }

          console.log('[Credentials] Verification successful:', result.record?.id);

          // 3. 查找或创建用户
          const supabase = createClient();
          const { data: user } = await supabase
            .from('wmc_users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (!user) {
            // 注册用户不存在（理论上不应该发生，因为verify-code API应该已经创建了用户）
            console.log('[Credentials] User not found:', credentials.email);

            // 如果是注册流程，创建用户
            if (credentials.purpose === 'register') {
              console.log('[Credentials] Creating new user...');

              // 生成用户名
              const usernameBase = credentials.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
              const { data: newUser } = await supabase
                .from('wmc_users')
                .insert({
                  email: credentials.email,
                  username: usernameBase,
                  tier: 'unverified',
                  creditsUsed: 0,
                  creditsReset: new Date().toISOString(),
                })
                .select()
                .single();

              if (!newUser) {
                console.error('[Credentials] Failed to create user');
                return null;
              }

              // 标记验证码为已使用
              if (result.record?.id) {
                await markCodeAsUsed(result.record.id);
              }

              return {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                tier: newUser.tier,
              };
            }

            return null;
          }

          // 4. 标记验证码为已使用
          if (result.record?.id) {
            await markCodeAsUsed(result.record.id);
          }

          // 5. 返回用户信息
          console.log('[Credentials] Authorization successful:', user.id);

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            tier: user.tier,
            creditsUsed: user.creditsUsed,
          };

        } catch (error) {
          console.error('[Credentials] Error during authorization:', error);
          return null;
        }
      }
    }),
  ],

  // Custom page routes
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user', // 新用户注册后跳转
  },

  // Session strategy - 使用 JWT，更适合无密码认证
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30天
  },

  // Callbacks to customize behavior
  callbacks: {
    // Include user data in JWT token
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;
        token.image = user.image;
        token.tier = user.tier || 'unverified';
        token.creditsUsed = user.creditsUsed || 0;
      }
      return token;
    },

    // Include user data in session
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.tier = token.tier;
        session.user.creditsUsed = token.creditsUsed;
      }
      return session;
    },

    // Handle sign in
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      console.log('[Auth] User signed in:', user.email, 'ID:', user.id);
      return true;
    },

    // Handle redirects
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Event handlers
  events: {
    async createUser({ user }: { user: any }) {
      console.log('[Auth] New user created:', user.email, 'ID:', user.id);
    },
    async signIn({ user }: { user: any }) {
      console.log('[Auth] User signed in:', user.email, 'ID:', user.id);
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Secret for JWT encryption
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};