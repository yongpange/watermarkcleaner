import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { increaseCredits, CreditsTransType, CreditsAmount } from '@/services/credit'
import { getOneYearLaterTimestr } from '@/lib/time'
import type { DatabaseWithWmc } from '@/types/database-wmc.types'

type User = DatabaseWithWmc['public']['Tables']['wmc_users']['Row']
type UserUpdate = DatabaseWithWmc['public']['Tables']['wmc_users']['Update']
type UserInsert = DatabaseWithWmc['public']['Tables']['wmc_users']['Insert']

/**
 * 同步 Supabase Auth 用户到 wmc_users 表
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
      .from('wmc_users')
      .select('*')
      .eq('email', email)
      .single() as { data: User | null; error: unknown }

    // 再通过 uuid 查找（正常场景）
    const { data: existingUserByUuid } = await supabase
      .from('wmc_users')
      .select('*')
      .eq('uuid', uuid)
      .single() as { data: User | null; error: unknown }

    if (existingUserByEmail && !existingUserByUuid) {
      // 迁移场景：用户存在但 uuid 不匹配
      // 更新现有用户的 id 为 Supabase Auth UUID
      console.log(`Migrating user ${email}: updating id from ${existingUserByEmail.id} to ${uuid}`)

      const updateData: UserUpdate = {
        id: uuid, // wmc_users表使用id字段，不是uuid
        name: nickname || existingUserByEmail.name, // wmc_users表使用name字段，不是nickname
        image: avatar_url || existingUserByEmail.image, // wmc_users表使用image字段，不是avatar_url
      }

      const { error: updateError } = await supabase
        .from('wmc_users')
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
      id: uuid, // wmc_users表使用id字段，不是uuid
      email,
      name: nickname || email.split('@')[0], // wmc_users表使用name字段，不是nickname
      image: avatar_url || '', // wmc_users表使用image字段，不是avatar_url
      emailVerified: null, // 新用户邮箱未验证
      tier: 'verified', // 默认设为已验证用户
      creditsUsed: 0, // 初始积分为0
      creditsReset: new Date().toISOString(), // 设置当前时间为重置时间
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from('wmc_users').insert(insertData as any)

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

