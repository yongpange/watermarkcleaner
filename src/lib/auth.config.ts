import EmailProvider from 'next-auth/providers/email';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import type { AuthOptions } from 'next-auth';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
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

export const authOptions: AuthOptions = {
  // 暂时禁用 SupabaseAdapter 以测试 Google OAuth
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
  // }),

  // Configure authentication providers
  providers: [
    // ==================== Google OAuth 登录 ====================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // 可选：只接受特定域名
      // authorization: {
      //   params: {
      //     prompt: "consent",
      //     access_type: "offline",
      //     response_type: "code"
      //   }
      // }
    }),

    // ==================== 邮箱验证码认证 ====================
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
                  creditsreset: new Date().toISOString(),
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },

  // Callbacks to customize behavior
  callbacks: {
    // Handle sign in events
    async signIn({ user, account, profile }) {
      console.log('[Auth] User signed in:', user.email, 'Provider:', account?.provider);
      console.log('[Auth] User details:', { user, account, profile });

      // 处理 Google 登录
      if (account?.provider === 'google') {
        try {
          console.log('[Google] Processing Google sign in...');
          console.log('[Google] User data:', user);
          console.log('[Google] Account data:', account);
          console.log('[Google] Profile data:', profile);

          const supabase = createAdminClient();

          // 检查用户是否已存在
          console.log('[Google] Checking if user exists:', user.email);
          const { data: existingUser } = await supabase
            .from('wmc_users')
            .select('*')
            .eq('email', user.email!)
            .single() as any;

          console.log('[Google] Existing user check result:', existingUser);

          if (!existingUser) {
            // 新用户：信任 Google 邮箱验证，直接设为 verified
            console.log('[Google] Creating new user with verified tier:', user.email);

            const username = user.name?.toLowerCase().replace(/[^a-z0-9_]/g, '_')
              || user.email!.split('@')[0].toLowerCase();

            console.log('[Google] Creating user with data:', {
              id: user.id,
              email: user.email,
              name: user.name || username,
              image: user.image,
              tier: 'verified',
              creditsused: 0,
              creditsreset: new Date().toISOString(),
            });

            const { error: createError } = await supabase
              .from('wmc_users')
              .insert({
                id: user.id!,  // Google user ID
                email: user.email!,
                name: user.name || username,
                image: user.image,
                tier: 'verified',  // ✅ Google 邮箱已验证，直接升级
                creditsused: 0,
                creditsreset: new Date().toISOString(),
              } as any);

            if (createError) {
              console.error('[Google] Failed to create user:', createError);
              console.error('[Google] Error details:', createError.message);
              return false;
            }

            console.log('[Google] User created successfully with verified tier');
          } else {
            // 已有用户：更新信息（可选）
            console.log('[Google] Existing user signed in:', existingUser.email);
          }
        } catch (error) {
          console.error('[Google] Error in signIn callback:', error);
          console.error('[Google] Error stack:', error instanceof Error ? error.stack : error);
          return false; // 返回 false 会显示 OAuthCallback 错误
        }
      }

      return true;  // 允许登录
    },

    // Include user data in JWT token
    async jwt({ token, user, account, trigger }) {
      // 初始登录时
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = (user as any).username;
        token.name = user.name;
        token.image = user.image;
        token.tier = (user as any).tier || 'unverified';
        token.creditsUsed = (user as any).creditsUsed || 0;
      }

      // 处理 Google 用户：从数据库获取最新 tier
      if (account?.provider === 'google' && user?.email) {
        try {
          const supabase = createAdminClient();
          const { data: dbUser } = await supabase
            .from('wmc_users')
            .select('tier, creditsused')
            .eq('email', user.email)
            .single() as any;

          if (dbUser) {
            token.tier = dbUser.tier;
            token.creditsUsed = dbUser.creditsused;
          }
        } catch (error) {
          console.error('[jwt] Error fetching user tier:', error);
        }
      }

      return token;
    },

    // Include user data in session
    async session({ session, token }) {
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
    async redirect({ url, baseUrl }) {
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