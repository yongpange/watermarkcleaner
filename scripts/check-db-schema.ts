
import { createAdminClient } from '../src/lib/supabase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDatabaseSchema() {
  console.log('🔍 检查数据库表结构\n');
  console.log('='.repeat(80));

  const supabase = createAdminClient();

  try {
    // 查询 wmc_users 表的结构
    console.log('\n📊 查询 wmc_users 表结构...\n');

    // 使用 raw SQL 查询表信息
    const { data: columns, error } = await supabase
      .rpc('pg_tabledef', { tablename: 'wmc_users' });

    if (error) {
      console.error('查询表结构失败:', error);

      // 备用方案：查询 information_schema
      const { data: infoColumns, error: infoError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'wmc_users')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (infoError) {
        console.error('备用查询也失败:', infoError);
        return;
      }

      console.log('✅ wmc_users 表结构:\n');
      console.log('Column Name'.padEnd(25) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(15) + 'Default');
      console.log('-'.repeat(80));

      infoColumns.forEach((col: any) => {
        const name = col.column_name.padEnd(25);
        const type = col.data_type.padEnd(20);
        const nullable = col.is_nullable.padEnd(15);
        const defaultVal = col.column_default || '';
        console.log(`${name}${type}${nullable}${defaultVal}`);
      });

      // 检查是否包含 creditsReset 或 credits_reset
      const hasCreditsReset = infoColumns.some((col: any) => col.column_name === 'creditsReset');
      const hasCredits_reset = infoColumns.some((col: any) => col.column_name === 'credits_reset');
      const hasCreditsUsed = infoColumns.some((col: any) => col.column_name === 'creditsUsed');
      const hasCredits_used = infoColumns.some((col: any) => col.column_name === 'credits_used');

      console.log('\n\n🎯 关键字段检查:');
      console.log(`- creditsReset (camelCase): ${hasCreditsReset ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`- credits_reset (snake_case): ${hasCredits_reset ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`- creditsUsed (camelCase): ${hasCreditsUsed ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`- credits_used (snake_case): ${hasCredits_used ? '✅ 存在' : '❌ 不存在'}`);

      if (hasCredits_reset && !hasCreditsReset) {
        console.log('\n⚠️  发现问题: 数据库使用 snake_case (credits_reset), 但代码使用 camelCase (creditsReset)!');
        console.log('解决方案: 修改代码使用下划线命名');
      }

      if (hasCredits_used && !hasCreditsUsed) {
        console.log('\n⚠️  发现问题: 数据库使用 snake_case (credits_used), 但代码使用 camelCase (creditsUsed)!');
      }

    } else {
      console.log('表结构:', columns);
    }

    // 查询最近的错误日志（如果有）
    console.log('\n\n📜 查询最近的验证码记录...\n');
    const { data: recentCodes, error: codesError } = await supabase
      .from('wmc_email_verification_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!codesError && recentCodes) {
      recentCodes.forEach((record: any, index: number) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Email: ${record.email}`);
        console.log(`  Code: ${record.code}`);
        console.log(`  Purpose: ${record.purpose}`);
        console.log(`  Created: ${record.created_at}`);
        console.log('');
      });
    }

  } catch (err) {
    console.error('执行失败:', err);
  }
}

// 如果 pg_tabledef 函数不存在，需要创建它
async function createPgTableDefFunction() {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('exec', {
    sql: `
    CREATE OR REPLACE FUNCTION pg_tabledef(tablename text)
    RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text)
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.columns c
      WHERE c.table_name = tablename
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position;
    END;
    $$ LANGUAGE plpgsql;
    `
  });

  if (error) {
    console.log('函数可能已经存在，继续...');
  }
}

// 运行检查
checkDatabaseSchema().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
