/**
 * 获取表结构信息
 * 使用 Supabase 查询
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableInfo() {
  console.log('获取表结构信息...\n');

  try {
    // 直接查询每个表
    const tables = ['users', 'accounts', 'sessions', 'verification_tokens', 'processing_history'];

    for (const tableName of tables) {
      console.log(`\n=== ${tableName} ===`);

      // 先尝试直接查询表名
      let { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        // 如果失败，尝试带 schema 的表名
        const { data: schemaData, error: schemaError } = await supabase
          .from(`watermarkcleaner.${tableName}`)
          .select('*')
          .limit(1);

        if (schemaError) {
          console.error(`查询 ${tableName} 失败:`, error.message, '/', schemaError.message);
          continue;
        }
        data = schemaData;
      }

      if (data && data.length > 0) {
        const row = data[0];
        console.log('列信息:');
        Object.keys(row).forEach(key => {
          const value = row[key];
          const type = value === null ? 'NULL' : typeof value;
          // 如果是字符串且看起来像日期，特别标注
          if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
            console.log(`  ${key}: ${type} (可能是日期/时间)`);
          } else {
            console.log(`  ${key}: ${type}`);
          }
        });
      } else {
        console.log('  表为空或无法访问');
      }

      // 获取总行数
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        console.log(`  总行数: ${count}`);
      }
    }

  } catch (error) {
    console.error('获取表信息失败:', error);
  }
}

// 执行
getTableInfo();