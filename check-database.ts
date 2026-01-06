import { createAdminClient } from './src/lib/supabase-admin'

async function checkDatabase() {
  try {
    const supabase = createAdminClient()

    console.log('=== 数据库表结构检查 ===\n')

    // 检查 wmc_users 表是否存在
    console.log('=== wmc_users 表检查 ===')
    const { data: userData, error: userError } = await supabase
      .from('wmc_users')
      .select('*')
      .limit(1)

    if (userError) {
      console.error('wmc_users 表查询失败:', userError)
      console.error('错误详情:', JSON.stringify(userError, null, 2))
    } else {
      console.log('wmc_users 表存在，数据示例:', userData)
    }

    // 检查 wmc_accounts 表（NextAuth 使用）
    console.log('\n=== wmc_accounts 表检查 ===')
    const { data: accountsData, error: accountsError } = await supabase
      .from('wmc_accounts')
      .select('*')
      .limit(1)

    if (accountsError) {
      console.error('wmc_accounts 表查询失败:', accountsError)
      console.error('错误详情:', JSON.stringify(accountsError, null, 2))
    } else {
      console.log('wmc_accounts 表存在，数据示例:', accountsData)
    }

    // 检查 wmc_sessions 表
    console.log('\n=== wmc_sessions 表检查 ===')
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('wmc_sessions')
      .select('*')
      .limit(1)

    if (sessionsError) {
      console.error('wmc_sessions 表查询失败:', sessionsError)
      console.error('错误详情:', JSON.stringify(sessionsError, null, 2))
    } else {
      console.log('wmc_sessions 表存在，数据示例:', sessionsData)
    }

    // 检查 RLS 策略
    console.log('\n=== RLS 策略检查 ===')
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .order('tablename')

    if (rlsError) {
      console.error('获取 RLS 策略失败:', rlsError)
    } else {
      console.log('RLS 策略:')
      rlsPolicies.forEach((policy: any) => {
        console.log(`- ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    }

    // 检查表结构详情
    console.log('\n=== 表结构详情 ===')
    const tables = ['wmc_users', 'wmc_accounts', 'wmc_sessions', 'wmc_verification_tokens']

    for (const table of tables) {
      const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', {
          table_name: table,
          schema_name: 'public'
        } as any)

      if (colError) {
        console.error(`${table} 列信息获取失败:`, colError.message)
      } else {
        console.log(`\n${table} 列结构:`)
        const cols = columns as any[]
        if (cols && cols.length > 0) {
          cols.forEach((col: any) => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
          })
        }
      }
    }

    // 检查是否有 schema 问题
    console.log('\n=== Schema 配置检查 ===')
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .in('schema_name', ['public', 'watermarkcleaner'])

    if (schemaError) {
      console.error('Schema 查询失败:', schemaError)
    } else {
      console.log('可用 schemas:', schemaData)
    }

  } catch (error) {
    console.error('数据库检查失败:', error)
  }
}

// 执行检查
checkDatabase()