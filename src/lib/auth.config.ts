import EmailProvider from 'next-auth/providers/email';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthConfig, User, Account, Profile, Session } from 'next-auth';
import type { TokenSet } from '@auth/core/types';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  verifyCode,
  markCodeAsUsed,
  type VerifyCodeResult
} from '@/lib/auth/verification';
import { CustomSupabaseAdapter } from './auth/custom-supabase-adapter';

/**
 * NextAuth.js configuration for email-based authentication
 *
 * Features:
 * - Email verification with magic links
 * - Email verification code (passwordless)
 * - Supabase database adapter
 * - Custom session callbacks to include user data
 */

export const authConfig: NextAuthConfig = {
  // 在开发环境中信任 host（解决 404 问题）
  trustHost: true,

  // ✅ 使用 Custom SupabaseAdapter 配置（使用现有的 wmc_* 表）
  adapter: CustomSupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
  }),

  // Configure authentication providers
  providers: [
    // ==================== Google OAuth 登录 ====================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // 允许自动链接已存在的同邮箱账户（解决 OAuthAccountNotLinked 错误）
      allowDangerousEmailAccountLinking: true,
      // 修复：移除 prompt 参数，添加 hd 参数来解决账户确认循环问题
      authorization: {
        params: {
          // prompt: 'select_account',  // 注释掉，可能导致账户确认循环
          // access_type: 'offline',
        },
      },
    }),

    // ==================== 邮箱验证码认证 ====================
    // 暂时注释掉 Credentials provider 来测试 Google OAuth
    Credentials({
      id: 'email-code',
      name: 'Email Verification Code',
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Verification Code", type: "text" },
        purpose: { label: "Purpose", type: "text" }
      },
      async authorize(credentials) {
        // 1. 验证输入
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;
        const purpose = credentials?.purpose as string | undefined;

        if (!email || !code || !purpose) {
          return null;
        }

        try {
          // 2. 验证验证码（确保安全性）
          const result: VerifyCodeResult = await verifyCode(
            email,
            code,
            purpose as 'register' | 'login' | 'update_email'
          );

          if (!result.valid) {
            throw new Error(result.reason || 'Verification failed');
          }

          // 3. 查找或创建用户
          const supabase = createAdminClient();
          const { data: user } = await supabase
            .from('wmc_users')
            .select('*')
            .eq('email', email)
            .single() as any;

          if (!user) {
            // 如果是注册流程，创建用户
            if (purpose === 'register') {
              const usernameBase = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
              const userId = crypto.randomUUID();

              const { error } = await supabase
                .from('wmc_users')
                .insert({
                  id: userId,
                  email: email,
                  name: usernameBase,
                  tier: 'verified',
                  creditsused: 0,
                } as any);

              if (error) {
                return null;
              }

              const { data: createdUsers } = await supabase
                .from('wmc_users')
                .select('*')
                .eq('email', email)
                .limit(1) as any;

              const createdUser = createdUsers && createdUsers.length > 0 ? createdUsers[0] : null;

              if (!createdUser) {
                return null;
              }

              return {
                id: createdUser.id,
                email: createdUser.email,
                username: createdUser.username || usernameBase,
                tier: createdUser.tier,
              };
            }

            return null;
          }

          // 4. 标记验证码为已使用
          if (result.record?.id) {
            await markCodeAsUsed(result.record.id);
          }

          // 5. 返回用户信息
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            tier: user.tier,
            creditsUsed: (user as any).creditsused || 0,
          };

        } catch (error) {
          console.error('[Credentials] Error during authorization:', error);
          return null;
        }
      }
    }),
  ],

  // 注意：NextAuth v5 使用内置页面，不需要自定义 pages 配置
  // 如果需要自定义页面，请创建对应的页面文件
  // pages: {
  //   signIn: '/auth/signin',
  //   signOut: '/auth/signout',
  //   error: '/auth/error',
  //   verifyRequest: '/auth/verify-request',
  //   newUser: '/auth/new-user',
  // },

  // Session strategy - 使用 JWT，更适合无密码认证
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },

  // Callbacks to customize behavior
  callbacks: {
    // ✅ signIn 回调 - 使用 CustomAdapter 时直接操作 wmc_users 表
    async signIn({ user, account, profile }: any) {
      console.log('[Auth] User signed in:', user?.email, 'Provider:', account?.provider);

      // ✅ Google 用户自动设置为 verified 并同步到 wmc_users
      if (account?.provider === 'google') {
        try {
          const supabase = createAdminClient();
          // 直接更新 wmc_users 表中的用户状态
          await supabase
            .from('wmc_users')
            .update({
              emailverified: new Date().toISOString()
            })
            .eq('email', user.email!);

          console.log('[Google] User marked as emailverified in wmc_users');
        } catch (error) {
          console.error('[Google] Error updating verification status:', error);
        }
      }

      return true;
    },

    // ✅ 简化 JWT 回调 - Adapter 自动提供 user 数据
    async jwt({ token, user, account, trigger }: any) {
      // 初始登录时，user 对象包含 Adapter 提供的数据
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        // 注意：Adapter 创建的 user 可能不包含自定义字段
        // 需要从数据库加载额外信息
        try {
          const supabase = createAdminClient();
          const { data: appUser } = await supabase
            .from('wmc_users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (appUser) {
            token.tier = appUser.tier || 'unverified';
            token.creditsUsed = appUser.creditsused || 0;
            console.log('[jwt] App user data loaded:', {
              tier: appUser.tier,
              credits: appUser.creditsused
            });
          }
        } catch (error) {
          console.error('[jwt] Error loading app user data:', error);
        }
      }

      return token;
    },

    // Include user data in session
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).username = token.username as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        (session.user as any).tier = token.tier as string;
        (session.user as any).creditsUsed = token.creditsUsed as number;
      }
      return session;
    },

    // Handle redirects
    async redirect({ url, baseUrl }: any) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // ✅ 事件处理程序 - Custom Adapter 直接操作 wmc_* 表
  events: {
    async createUser({ user }: { user: any }) {
      console.log('[Auth] ✅ New user created directly in wmc_users:', user?.email, 'ID:', user?.id);
    },

    async linkAccount({ user, account }: { user: any, account: any }) {
      console.log('[Auth] ✅ Account linked in wmc_accounts:', account?.provider, 'for user:', user?.email);
    },

    async signIn({ user }: { user: any }) {
      console.log('[Auth] ✅ User signed in:', user?.email, 'ID:', user?.id);
    },

    async session({ session }: { session: any }) {
      console.log('[Auth] ✅ Session created from wmc_sessions for:', session?.user?.email);
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Secret for JWT encryption
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};