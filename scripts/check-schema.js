const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  console.log('🔍 检查数据库表结构\n');
  console.log('=' .repeat(80));

  try {
    // 查询 information_schema 获取表结构
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'wmc_users')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    console.log('\n✅ wmc_users 表结构:\n');
    console.log('Column Name'.padEnd(25) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(15) + 'Default');
    console.log('-'.repeat(80));

    columns.forEach((col) => {
      const name = col.column_name.padEnd(25);
      const type = col.data_type.padEnd(20);
      const nullable = col.is_nullable.padEnd(15);
      const defaultVal = col.column_default || '';
      console.log(`${name}${type}${nullable}${defaultVal}`);
    });

    // 检查关键字段
    console.log('\n\n🎯 关键字段检查:');

    const hasCreditsReset = columns.some(col => col.column_name === 'creditsReset');
    const hasCredits_reset = columns.some(col => col.column_name === 'credits_reset');
    const hasCreditsUsed = columns.some(col => col.column_name === 'creditsUsed');
    const hasCredits_used = columns.some(col => col.column_name === 'credits_used');

    console.log(`- creditsReset (camelCase): ${hasCreditsReset ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`- credits_reset (snake_case): ${hasCredits_reset ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`- creditsUsed (camelCase): ${hasCreditsUsed ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`- credits_used (snake_case): ${hasCredits_used ? '✅ 存在' : '❌ 不存在'}`);

    if (hasCredits_reset && !hasCreditsReset) {
      console.log('\n⚠️  发现问题: 数据库使用 snake_case (credits_reset)!');
      console.log('   但代码使用 camelCase (creditsReset)');
      console.log('\n💡 解决方案: 需要修改代码使用下划线命名');
    }

    if (hasCredits_used && !hasCreditsUsed) {
      console.log('\n⚠️  发现问题: 数据库使用 snake_case (credits_used)!');
      console.log('   但代码使用 camelCase (creditsUsed)');
    }

    if ((hasCreditsReset || hasCreditsUsed) && !(hasCredits_reset || hasCredits_used)) {
      console.log('\n✅ 数据库使用 camelCase，代码也使用 camelCase');
      console.log('   这应该是正确的配置');
    }

  } catch (err) {
    console.error('❌ 执行失败:', err);
  }
}

// 运行检查
checkSchema().then(() => {
  console.log('\n' + '='.repeat(80));
  console.log('检查完成');
  process.exit(0);
}).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
