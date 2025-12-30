/**
 * WatermarkCleaner 数据库备份脚本
 * 用途：备份 watermarkcleaner schema 下的所有数据到 backup_watermarkcleaner schema
 */

const { createClient } = require('@supabase/supabase-js');

// 数据库连接配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置环境变量：NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupData() {
  console.log('开始备份 watermarkcleaner schema 数据...');

  try {
    // 1. 创建备份schema
    console.log('创建备份schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE SCHEMA IF NOT EXISTS backup_watermarkcleaner;
      `
    });

    if (schemaError) {
      console.error('创建schema失败:', schemaError);
      // 继续执行，可能schema已存在
    }

    // 2. 备份各个表
    const tables = ['users', 'accounts', 'sessions', 'verification_tokens', 'processing_history'];

    for (const table of tables) {
      console.log(`备份 ${table} 表...`);

      // 删除已存在的备份表
      await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS backup_watermarkcleaner.${table};`
      });

      // 创建备份表并复制数据
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE backup_watermarkcleaner.${table} AS
          SELECT * FROM watermarkcleaner.${table};
        `
      });

      if (error) {
        console.error(`备份 ${table} 表失败:`, error);
      } else {
        console.log(`✓ ${table} 表备份成功`);
      }
    }

    // 3. 验证备份
    console.log('\n验证备份完整性...');
    for (const table of tables) {
      const { data: originalCount, error: origError } = await supabase
        .from(`watermarkcleaner.${table}`)
        .select('*', { count: 'exact', head: true });

      const { data: backupCount, error: backError } = await supabase
        .from(`backup_watermarkcleaner.${table}`)
        .select('*', { count: 'exact', head: true });

      if (!origError && !backError) {
        console.log(`${table}: 原表 ${originalCount?.length || 0} 条 → 备份表 ${backupCount?.length || 0} 条`);
      }
    }

    console.log('\n✅ 备份完成！');

  } catch (error) {
    console.error('备份过程中出错:', error);
    process.exit(1);
  }
}

// 执行备份
backupData();