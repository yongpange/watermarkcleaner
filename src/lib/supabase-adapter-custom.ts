/**
 * 自定义 Supabase Adapter for NextAuth.js
 * 使用 wmc_ 前缀的表名
 */

import { SupabaseAdapter } from '@auth/supabase-adapter';
import type { Adapter } from 'next-auth/adapters';

/**
 * 创建自定义的 Supabase Adapter，使用 wmc_ 前缀表
 */
export function CustomSupabaseAdapter(options: {
  url: string;
  secret: string;
}) {
  // 获取默认的 SupabaseAdapter 实例
  const adapter = SupabaseAdapter(options) as Adapter;

  // 创建自定义的 adapter，重写表名
  return {
    // User 相关方法
    async createUser(user: any) {
      const result = await adapter.createUser?.(user);
      return result;
    },

    async getUser(id: string) {
      // 从 wmc_users 表查询
      const response = await fetch(`${options.url}/rest/v1/wmc_users?id=eq.${id}`, {
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;
      const users = await response.json();
      return users[0] || null;
    },

    async getUserByEmail(email: string) {
      const response = await fetch(`${options.url}/rest/v1/wmc_users?email=eq.${encodeURIComponent(email)}`, {
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;
      const users = await response.json();
      return users[0] || null;
    },

    async getUserByAccount(provider: string, providerAccountId: string) {
      const response = await fetch(
        `${options.url}/rest/v1/wmc_accounts?provider=eq.${provider}&providerAccountId=eq.${encodeURIComponent(providerAccountId)}`,
        {
          headers: {
            'apikey': options.secret,
            'Authorization': `Bearer ${options.secret}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) return null;
      const accounts = await response.json();
      if (accounts[0]) {
        return this.getUser(accounts[0].userId);
      }
      return null;
    },

    async updateUser(user: any) {
      const response = await fetch(`${options.url}/rest/v1/wmc_users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) return null;
      const users = await response.json();
      return users[0] || null;
    },

    async deleteUser(userId: string) {
      await fetch(`${options.url}/rest/v1/wmc_users?id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
        },
      });
    },

    // Account 相关方法
    async linkAccount(account: any) {
      const response = await fetch(`${options.url}/rest/v1/wmc_accounts`, {
        method: 'POST',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(account),
      });

      if (!response.ok) return null;
      const accounts = await response.json();
      return accounts[0] || null;
    },

    async unlinkAccount(userId: string, provider: string, providerAccountId: string) {
      await fetch(
        `${options.url}/rest/v1/wmc_accounts?userId=eq.${userId}&provider=eq.${provider}&providerAccountId=eq.${encodeURIComponent(providerAccountId)}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': options.secret,
            'Authorization': `Bearer ${options.secret}`,
          },
        }
      );
    },

    // Session 相关方法
    async createSession(session: any) {
      const response = await fetch(`${options.url}/rest/v1/wmc_sessions`, {
        method: 'POST',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) return null;
      const sessions = await response.json();
      return sessions[0] || null;
    },

    async getSessionAndUser(sessionToken: string) {
      const response = await fetch(`${options.url}/rest/v1/wmc_sessions?sessionToken=eq.${encodeURIComponent(sessionToken)}`, {
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;
      const sessions = await response.json();
      if (sessions[0]) {
        const user = await this.getUser(sessions[0].userId);
        if (user) {
          return {
            session: { ...sessions[0], userId: user.id },
            user,
          };
        }
      }
      return null;
    },

    async updateSession(session: any) {
      const response = await fetch(`${options.url}/rest/v1/wmc_sessions?sessionToken=eq.${encodeURIComponent(session.sessionToken)}`, {
        method: 'PATCH',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) return null;
      const sessions = await response.json();
      return sessions[0] || null;
    },

    async deleteSession(sessionToken: string) {
      await fetch(`${options.url}/rest/v1/wmc_sessions?sessionToken=eq.${encodeURIComponent(sessionToken)}`, {
        method: 'DELETE',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
        },
      });
    },

    // VerificationToken 相关方法
    async createVerificationToken(verificationToken: any) {
      const response = await fetch(`${options.url}/rest/v1/wmc_verification_tokens`, {
        method: 'POST',
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(verificationToken),
      });

      if (!response.ok) return null;
      const tokens = await response.json();
      return tokens[0] || null;
    },

    async useVerificationToken(identifier: string, token: string) {
      const response = await fetch(`${options.url}/rest/v1/wmc_verification_tokens?identifier=eq.${encodeURIComponent(identifier)}&token=eq.${encodeURIComponent(token)}`, {
        headers: {
          'apikey': options.secret,
          'Authorization': `Bearer ${options.secret}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;
      const tokens = await response.json();
      if (tokens[0]) {
        // 删除已使用的令牌
        await fetch(`${options.url}/rest/v1/wmc_verification_tokens?identifier=eq.${encodeURIComponent(identifier)}&token=eq.${encodeURIComponent(token)}`, {
          method: 'DELETE',
          headers: {
            'apikey': options.secret,
            'Authorization': `Bearer ${options.secret}`,
          },
        });
        return tokens[0];
      }
      return null;
    },
  } as Adapter;
}