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
      // 其他业务表
      orders: {
        Row: {
          id: number
          order_no: string
          created_at: string | null
          user_uuid: string
          user_email: string
          amount: number
          interval: string | null
          expired_at: string | null
          status: string
          stripe_session_id: string | null
          credits: number
          currency: string | null
          sub_id: string | null
          sub_interval_count: number | null
          sub_cycle_anchor: number | null
          sub_period_end: number | null
          sub_period_start: number | null
          sub_times: number | null
          product_id: string | null
          product_name: string | null
          valid_months: number | null
          order_detail: string | null
          paid_at: string | null
          paid_email: string | null
          paid_detail: string | null
        }
        Insert: {
          id?: never
          order_no: string
          created_at?: string | null
          user_uuid?: string
          user_email?: string
          amount: number
          interval?: string | null
          expired_at?: string | null
          status: string
          stripe_session_id?: string | null
          credits: number
          currency?: string | null
          sub_id?: string | null
          sub_interval_count?: number | null
          sub_cycle_anchor?: number | null
          sub_period_end?: number | null
          sub_period_start?: number | null
          sub_times?: number | null
          product_id?: string | null
          product_name?: string | null
          valid_months?: number | null
          order_detail?: string | null
          paid_at?: string | null
          paid_email?: string | null
          paid_detail?: string | null
        }
        Update: {
          id?: never
          order_no?: string
          created_at?: string | null
          user_uuid?: string
          user_email?: string
          amount?: number
          interval?: string | null
          expired_at?: string | null
          status?: string
          stripe_session_id?: string | null
          credits?: number
          currency?: string | null
          sub_id?: string | null
          sub_interval_count?: number | null
          sub_cycle_anchor?: number | null
          sub_period_end?: number | null
          sub_period_start?: number | null
          sub_times?: number | null
          product_id?: string | null
          product_name?: string | null
          valid_months?: number | null
          order_detail?: string | null
          paid_at?: string | null
          paid_email?: string | null
          paid_detail?: string | null
        }
      }
      apikeys: {
        Row: {
          id: number
          api_key: string
          title: string | null
          user_uuid: string
          created_at: string | null
          status: string | null
        }
        Insert: {
          id?: never
          api_key: string
          title?: string | null
          user_uuid: string
          created_at?: string | null
          status?: string | null
        }
        Update: {
          id?: never
          api_key?: string
          title?: string | null
          user_uuid?: string
          created_at?: string | null
          status?: string | null
        }
      }
      credits: {
        Row: {
          id: number
          trans_no: string
          created_at: string | null
          user_uuid: string
          trans_type: string
          credits: number
          order_no: string | null
          expired_at: string | null
        }
        Insert: {
          id?: never
          trans_no: string
          created_at?: string | null
          user_uuid: string
          trans_type: string
          credits: number
          order_no?: string | null
          expired_at?: string | null
        }
        Update: {
          id?: never
          trans_no?: string
          created_at?: string | null
          user_uuid?: string
          trans_type?: string
          credits?: number
          order_no?: string | null
          expired_at?: string | null
        }
      }
      conversions: {
        Row: {
          id: number
          uuid: string
          user_uuid: string | null
          file_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string | null
          status: string
          progress: number
          result: Json | null
          error: Json | null
          created_at: string | null
          completed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: never
          uuid: string
          user_uuid?: string | null
          file_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url?: string | null
          status?: string
          progress?: number
          result?: Json | null
          error?: Json | null
          created_at?: string | null
          completed_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: never
          uuid?: string
          user_uuid?: string | null
          file_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          status?: string
          progress?: number
          result?: Json | null
          error?: Json | null
          created_at?: string | null
          completed_at?: string | null
          expires_at?: string | null
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
      chat_sessions: {
        Row: {
          id: number
          uuid: string
          user_uuid: string | null
          file_id: string
          messages: Json
          created_at: string | null
          updated_at: string | null
          expires_at: string | null
          message_count: number
          last_message_at: string | null
        }
        Insert: {
          id?: never
          uuid: string
          user_uuid?: string | null
          file_id: string
          messages?: Json
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          message_count?: number
          last_message_at?: string | null
        }
        Update: {
          id?: never
          uuid?: string
          user_uuid?: string | null
          file_id?: string
          messages?: Json
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          message_count?: number
          last_message_at?: string | null
        }
      }
      flashcards: {
        Row: {
          id: number
          uuid: string
          user_uuid: string | null
          file_id: string
          question: string
          answer: string
          explanation: string | null
          source: string
          order: number
          views: number
          mastery: number
          ease_factor: number
          interval: number
          repetitions: number
          last_reviewed_at: string | null
          next_review_at: string | null
          is_favorited: boolean
          tags: string | null
          created_at: string | null
          updated_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: never
          uuid: string
          user_uuid?: string | null
          file_id: string
          question: string
          answer: string
          explanation?: string | null
          source?: string
          order?: number
          views?: number
          mastery?: number
          ease_factor?: number
          interval?: number
          repetitions?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          is_favorited?: boolean
          tags?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: never
          uuid?: string
          user_uuid?: string | null
          file_id?: string
          question?: string
          answer?: string
          explanation?: string | null
          source?: string
          order?: number
          views?: number
          mastery?: number
          ease_factor?: number
          interval?: number
          repetitions?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          is_favorited?: boolean
          tags?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
        }
      }
      // 其他表定义...
      posts: {
        Row: {
          id: number
          uuid: string
          slug: string | null
          title: string | null
          description: string | null
          content: string | null
          created_at: string | null
          updated_at: string | null
          status: string | null
          cover_url: string | null
          author_name: string | null
          author_avatar_url: string | null
          locale: string | null
        }
        Insert: {
          id?: never
          uuid: string
          slug?: string | null
          title?: string | null
          description?: string | null
          content?: string | null
          created_at?: string | null
          updated_at?: string | null
          status?: string | null
          cover_url?: string | null
          author_name?: string | null
          author_avatar_url?: string | null
          locale?: string | null
        }
        Update: {
          id?: never
          uuid?: string
          slug?: string | null
          title?: string | null
          description?: string | null
          content?: string | null
          created_at?: string | null
          updated_at?: string | null
          status?: string | null
          cover_url?: string | null
          author_name?: string | null
          author_avatar_url?: string | null
          locale?: string | null
        }
      }
      affiliates: {
        Row: {
          id: number
          user_uuid: string
          created_at: string | null
          status: string
          invited_by: string
          paid_order_no: string
          paid_amount: number
          reward_percent: number
          reward_amount: number
        }
        Insert: {
          id?: never
          user_uuid: string
          created_at?: string | null
          status?: string
          invited_by: string
          paid_order_no?: string
          paid_amount?: number
          reward_percent?: number
          reward_amount?: number
        }
        Update: {
          id?: never
          user_uuid?: string
          created_at?: string | null
          status?: string
          invited_by?: string
          paid_order_no?: string
          paid_amount?: number
          reward_percent?: number
          reward_amount?: number
        }
      }
      feedbacks: {
        Row: {
          id: number
          created_at: string | null
          status: string | null
          user_uuid: string | null
          content: string | null
          rating: number | null
        }
        Insert: {
          id?: never
          created_at?: string | null
          status?: string | null
          user_uuid?: string | null
          content?: string | null
          rating?: number | null
        }
        Update: {
          id?: never
          created_at?: string | null
          status?: string | null
          user_uuid?: string | null
          content?: string | null
          rating?: number | null
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