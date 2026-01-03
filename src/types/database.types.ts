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

