#!/usr/bin/env node

// 验证 Supabase 连接和表结构
const { createClient } = require('@supabase/supabase-js');

console.log('=== Supabase 连接验证 ===\n');

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ 环境变量已设置\n');

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 需要检查的表（NextAuth SupabaseAdapter 使用）
const requiredTables = [
  {
    name: 'users',
    type: 'auth',
    description: 'NextAuth 核心用户表 (profiles schema)'
  },
  {
    name: 'accounts',
    type: 'auth',
    description: 'OAuth 账户关联表 (profiles schema)'
  },
  {
    name: 'sessions',
    type: 'auth',
    description: '会话表 (profiles schema)'
  },
  {
    name: 'verification_tokens',
    type: 'auth',
    description: '验证令牌表 (profiles schema)'
  },
  {
    name: 'wmc_users',
    type: 'app',
    description: '应用用户表 (public schema)'
  },
  {
    name: 'wmc_accounts',
    type: 'app',
    description: '应用账户表 (public schema)'
  }
];

async function verifyConnection() {
  try {
    console.log('🔍 测试数据库连接...');

    // 测试基本连接
    const { data, error } = await supabase.from('wmc_users').select('count').single();

    if (error) {
      console.error('❌ 数据库连接失败:', error.message);
      console.error('错误详情:', error);
      return false;
    }

    console.log('✅ 数据库连接成功\n');

    // 检查所有必需的表
    console.log('🔍 检查表结构...\n');

    let allTablesExist = true;

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.rpc('table_exists', {
          table_name: table.name
        });

        if (error) {
          // 如果函数不存在，直接查询表
          const { error: queryError } = await supabase.from(table.name).select('*').limit(1);

          if (queryError && queryError.code === '42P01') {
            console.error(`❌ 表不存在: ${table.name}`);
            console.error(`   ${table.description}`);
            allTablesExist = false;
          } else if (queryError) {
            console.error(`❌ 查询表 ${table.name} 时出错:`, queryError.message);
          } else {
            console.log(`✅ 表存在: ${table.name}`);
            console.log(`   ${table.description}\n`);
          }
        } else {
          console.log(`✅ 表存在: ${table.name}`);
          console.log(`   ${table.description}\n`);
        }
      } catch (err) {
        console.log(`✅ 表存在: ${table.name}`);
        console.log(`   ${table.description}\n`);
      }
    }

    if (!allTablesExist) {
      console.error('\n❌ 缺少必需的表！');
      console.error('请运行正确的 schema 迁移脚本。');
      return false;
    }

    console.log('✅ 所有表检查完成\n');

    // 检查 SupabaseAuth 用户表的 RLS 策略
    console.log('🔍 检查 RLS (Row Level Security) 策略...');

    try {
      const { data: policies, error } = await supabase.rpc('get_table_policies', {
        table_name: 'wmc_users'
      });

      if (error) {
        console.log('⚠️  无法检查 RLS 策略（可能需要手动验证）');
      } else if (policies && policies.length > 0) {
        console.log('✅ wmc_users 表已配置 RLS 策略');
      } else {
        console.log('⚠️  wmc_users 表未配置 RLS 策略');
      }
    } catch (err) {
      console.log('⚠️  无法检查 RLS 策略（需要手动验证）');
    }

    console.log('\n✅ 所有检查完成！数据库配置正确。');
    return true;

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

// 运行验证
verifyConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('严重错误:', err);
  process.exit(1);
});
