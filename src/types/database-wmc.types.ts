/**
 * Database types for wmc_ prefixed tables
 *
 * 这个文件定义了所有带 wmc_ 前缀的数据库表的 TypeScript 类型
 *
 * 这些表是从 watermarkcleaner schema 迁移到 public schema 的表
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface DatabaseWithWmc {
  public: {
    Tables: {
      // 原有的表定义（保持不变）
      users: {
        Row: {
          id: number
          uuid: string
          email: string
          created_at: string | null
          nickname: string | null
          avatar_url: string | null
          locale: string | null
          signin_type: string | null
          signin_ip: string | null
          signin_provider: string | null
          signin_openid: string | null
          invite_code: string
          updated_at: string | null
          invited_by: string
          is_affiliate: boolean
        }
        Insert: {
          id?: never
          uuid: string
          email: string
          created_at?: string | null
          nickname?: string | null
          avatar_url?: string | null
          locale?: string | null
          signin_type?: string | null
          signin_ip?: string | null
          signin_provider?: string | null
          signin_openid?: string | null
          invite_code?: string
          updated_at?: string | null
          invited_by?: string
          is_affiliate?: boolean
        }
        Update: {
          id?: never
          uuid?: string
          email?: string
          created_at?: string | null
          nickname?: string | null
          avatar_url?: string | null
          locale?: string | null
          signin_type?: string | null
          signin_ip?: string | null
          signin_provider?: string | null
          signin_openid?: string | null
          invite_code?: string
          updated_at?: string | null
          invited_by?: string
          is_affiliate?: boolean
        }
      }
      // wmc_ 前缀的表（NextAuth.js 相关）
      wmc_users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          emailVerified: string | null
          tier: string | null
          creditsUsed: number | null
          creditsReset: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          image?: string | null
          emailVerified?: string | null
          tier?: string | null
          creditsUsed?: number | null
          creditsReset?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          emailVerified?: string | null
          tier?: string | null
          creditsUsed?: number | null
          creditsReset?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      wmc_accounts: {
        Row: {
          id: string
          userId: string
          type: string
          provider: string
          providerAccountId: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          userId: string
          type: string
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          userId?: string
          type?: string
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      wmc_sessions: {
        Row: {
          id: string
          sessionToken: string
          userId: string
          expires: string
          created_at: string | null
        }
        Insert: {
          id?: string
          sessionToken: string
          userId: string
          expires: string
          created_at?: string | null
        }
        Update: {
          id?: string
          sessionToken?: string
          userId?: string
          expires?: string
          created_at?: string | null
        }
      }
      wmc_verification_tokens: {
        Row: {
          identifier: string
          token: string
          expires: string
          created_at: string | null
        }
        Insert: {
          identifier: string
          token: string
          expires: string
          created_at?: string | null
        }
        Update: {
          identifier?: string
          token?: string
          expires?: string
          created_at?: string | null
        }
      }
      wmc_processing_history: {
        Row: {
          id: string
          user_id: string | null
          ip_address: string | null
          image_size: number | null
          success: boolean | null
          processing_time_ms: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          ip_address?: string | null
          image_size?: number | null
          success?: boolean | null
          processing_time_ms?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          ip_address?: string | null
          image_size?: number | null
          success?: boolean | null
          processing_time_ms?: number | null
          created_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: number
          user_uuid: string
          locale: string
          theme: string
          auto_detect_language: boolean
          default_export_format: string
          updated_at: string | null
        }
        Insert: {
          id?: never
          user_uuid: string
          locale?: string
          theme?: string
          auto_detect_language?: boolean
          default_export_format?: string
          updated_at?: string | null
        }
        Update: {
          id?: never
          user_uuid?: string
          locale?: string
          theme?: string
          auto_detect_language?: boolean
          default_export_format?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 导出类型别名，方便在代码中使用
export type WmcUser = DatabaseWithWmc['public']['Tables']['wmc_users']['Row']
export type WmcAccount = DatabaseWithWmc['public']['Tables']['wmc_accounts']['Row']
export type WmcSession = DatabaseWithWmc['public']['Tables']['wmc_sessions']['Row']
export type WmcVerificationToken = DatabaseWithWmc['public']['Tables']['wmc_verification_tokens']['Row']
export type WmcProcessingHistory = DatabaseWithWmc['public']['Tables']['wmc_processing_history']['Row']