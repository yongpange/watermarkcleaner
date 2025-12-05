import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { increaseCredits, CreditsTransType, CreditsAmount } from '@/services/credit'
import { getOneYearLaterTimestr } from '@/lib/time'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']
type UserInsert = Database['public']['Tables']['users']['Insert']

/**
 * 同步 Supabase Auth 用户到 users 表
 * 
 * 调用时机：
 * - 用户首次登录（SIGNED_IN 事件）
 * - 由 SupabaseAuthProvider 自动调用
 * 
 * 功能：
 * - 检查用户是否已存在（通过 email）
 * - 如果存在：更新 uuid 为 Supabase Auth UUID（用于迁移）
 * - 如果不存在：创建新用户并赠送积分
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { uuid, email, nickname, avatar_url, signin_provider } = body

    if (!uuid || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: uuid, email' },
        { status: 400 }
      )
    }

    // 先通过 email 查找现有用户（用于迁移场景）
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single() as { data: User | null; error: unknown }

    // 再通过 uuid 查找（正常场景）
    const { data: existingUserByUuid } = await supabase
      .from('users')
      .select('*')
      .eq('uuid', uuid)
      .single() as { data: User | null; error: unknown }

    if (existingUserByEmail && !existingUserByUuid) {
      // 迁移场景：用户存在但 uuid 不匹配
      // 更新现有用户的 uuid 为 Supabase Auth UUID
      console.log(`Migrating user ${email}: updating uuid from ${existingUserByEmail.uuid} to ${uuid}`)
      
      const updateData: UserUpdate = {
        uuid,
        nickname: nickname || existingUserByEmail.nickname,
        avatar_url: avatar_url || existingUserByEmail.avatar_url,
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData as never)
        .eq('email', email)

      if (updateError) {
        console.error('Failed to migrate user:', updateError)
        throw updateError
      }

      return NextResponse.json({ 
        success: true, 
        migrated: true,
        message: 'User migrated successfully' 
      })
    }

    if (existingUserByUuid) {
      // 用户已存在，无需操作
      return NextResponse.json({ 
        success: true, 
        existing: true,
        message: 'User already exists' 
      })
    }

    // 新用户：创建用户记录
    console.log(`Creating new user: ${email}`)

    const insertData: UserInsert = {
      uuid,
      email,
      nickname: nickname || email.split('@')[0],
      avatar_url: avatar_url || '',
      signin_type: 'oauth',
      signin_provider: signin_provider || 'google',
      signin_openid: uuid, // Supabase Auth UUID
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from('users').insert(insertData as any)

    if (insertError) {
      console.error('Failed to create user:', insertError)
      throw insertError
    }

    // 赠送新用户积分
    try {
      await increaseCredits({
        user_uuid: uuid,
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet,
        expired_at: getOneYearLaterTimestr(),
      })
      console.log(`Granted ${CreditsAmount.NewUserGet} credits to new user ${email}`)
    } catch (creditError) {
      console.error('Failed to grant credits to new user:', creditError)
      // 不抛出错误，因为用户已创建成功
    }

    return NextResponse.json({ 
      success: true, 
      created: true,
      message: 'User created successfully' 
    })
  } catch (error) {
    console.error('Sync user error:', error)
    return NextResponse.json(
      { error: 'Failed to sync user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

