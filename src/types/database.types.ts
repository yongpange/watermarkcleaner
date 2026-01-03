/**
 * Database types for Supabase
 *
 * 这个文件定义了所有数据库表的 TypeScript 类型
 * 通常应该使用 `supabase gen types typescript` 命令生成
 *
 * 如果需要重新生成，请运行：
 * npx supabase gen types typescript --project-id <your-project-id> > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 导入 wmc_ 表的类型定义
import { DatabaseWithWmc } from './database-wmc.types'

// 合并 Database 和 DatabaseWithWmc
export interface Database extends Omit<DatabaseWithWmc, 'public'> {
  public: DatabaseWithWmc['public'] & {
    Tables: DatabaseWithWmc['public']['Tables'] & {
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

