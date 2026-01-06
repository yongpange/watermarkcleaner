const { createAdminClient } = require('./src/lib/supabase-admin.ts')

async function checkDatabase() {
  try {
    const supabase = createAdminClient()

    console.log('=== 数据库表结构检查 ===\n')

    // 检查所有表
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables', {
        schema_name: 'public'
      })

    if (tablesError) {
      console.error('获取表列表失败:', tablesError)
    } else {
      console.log('公开模式下的表:')
      console.log(tables)
    }

    // 检查 wmc_users 表结构
    console.log('\n=== wmc_users 表结构 ===')
    const { data: userColumns, error: userError } = await supabase
      .rpc('get_table_columns', {
        table_name: 'wmc_users',
        schema_name: 'public'
      })

    if (userError) {
      console.error('获取 wmc_users 表结构失败:', userError)

      // 尝试直接查询
      const { data: directData, error: directError } = await supabase
        .from('wmc_users')
        .select('*')
        .limit(1)

      if (directError) {
        console.error('直接查询 wmc_users 失败:', directError)
      } else {
        console.log('wmc_users 表存在，示例数据:', directData)
      }
    } else {
      console.log('wmc_users 表结构:')
      console.log(userColumns)
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
      rlsPolicies.forEach(policy => {
        console.log(`- ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    }

    // 检查 schema 权限
    console.log('\n=== Schema 权限检查 ===')
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name, schema_owner')
      .in('schema_name', ['public', 'watermarkcleaner'])

    if (schemaError) {
      console.error('获取 schema 信息失败:', schemaError)
    } else {
      console.log('Schema 信息:')
      console.log(schemaInfo)
    }

    // 检查 wmc_accounts 表（NextAuth 使用）
    console.log('\n=== wmc_accounts 表检查 ===')
    const { data: accountsData, error: accountsError } = await supabase
      .from('wmc_accounts')
      .select('*')
      .limit(1)

    if (accountsError) {
      console.error('wmc_accounts 表查询失败:', accountsError)
    } else {
      console.log('wmc_accounts 表存在，示例数据:', accountsData)
    }

    // 检查 wmc_sessions 表
    console.log('\n=== wmc_sessions 表检查 ===')
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('wmc_sessions')
      .select('*')
      .limit(1)

    if (sessionsError) {
      console.error('wmc_sessions 表查询失败:', sessionsError)
    } else {
      console.log('wmc_sessions 表存在，示例数据:', sessionsData)
    }

  } catch (error) {
    console.error('数据库检查失败:', error)
  }
}

// 执行检查
checkDatabase()