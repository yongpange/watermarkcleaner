/**
 * 获取 watermarkcleaner schema 下所有表的详细结构
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableStructure() {
  console.log('获取 watermarkcleaner schema 表结构...\n');

  try {
    // 获取所有表名
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'watermarkcleaner'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.error('获取表名失败:', tablesError);
      return;
    }

    console.log('发现的表:');
    tables.forEach(table => console.log(`- ${table.table_name}`));
    console.log('\n表结构详情:');

    // 获取每个表的列信息
    for (const table of tables) {
      console.log(`\n=== ${table.table_name} ===`);

      const { data: columns, error: columnsError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT
              column_name,
              data_type,
              udt_name,
              is_nullable,
              column_default,
              character_maximum_length,
              numeric_precision,
              numeric_scale
            FROM information_schema.columns
            WHERE table_schema = 'watermarkcleaner'
              AND table_name = '${table.table_name}'
            ORDER BY ordinal_position;
          `
        });

      if (columnsError) {
        console.error(`获取 ${table.table_name} 列信息失败:`, columnsError);
        continue;
      }

      // 格式化输出
      console.log(`列名\t\t数据类型\t\t可空\t默认值`);
      console.log(`${'-'.repeat(60)}`);
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultVal = col.column_default || '';
        console.log(`${col.column_name.padEnd(15)}\t${col.data_type.padEnd(15)}\t${nullable.padEnd(4)}\t${defaultVal}`);
      });

      // 获取主键
      const { data: pks, error: pkError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'watermarkcleaner'
              AND tc.table_name = '${table.table_name}'
            ORDER BY kcu.ordinal_position;
          `
        });

      if (!pkError && pks.length > 0) {
        console.log(`主键: ${pks.map(pk => pk.column_name).join(', ')}`);
      }

      // 获取外键
      const { data: fks, error: fkError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'watermarkcleaner'
              AND tc.table_name = '${table.table_name}';
          `
        });

      if (!fkError && fks.length > 0) {
        fks.forEach(fk => {
          console.log(`外键: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    }

  } catch (error) {
    console.error('获取表结构失败:', error);
  }
}

// 执行
getTableStructure();