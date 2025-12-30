/**
 * 列出数据库中所有表
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
  console.log('列出数据库中所有表...\n');

  try {
    // 查询所有 schema 下的表
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .order('table_schema', { ascending: true })
      .order('table_name', { ascending: true });

    if (error) {
      console.error('查询失败:', error);
      return;
    }

    console.log('数据库中的表:');
    console.log('SCHEMA\t\t\tTABLE NAME\t\tTYPE');
    console.log('---'.repeat(20));

    data.forEach(table => {
      console.log(`${table.table_schema.padEnd(20)}\t${table.table_name.padEnd(20)}\t${table.table_type}`);
    });

    // 特别查看 watermarkcleaner schema 下的表
    console.log('\n\nwatermarkcleaner schema 下的表:');
    const watermarkcleanerTables = data.filter(t => t.table_schema === 'watermarkcleaner');
    if (watermarkcleanerTables.length > 0) {
      watermarkcleanerTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    } else {
      console.log('没有找到 watermarkcleaner schema 下的表');
    }

    // 查看 public schema 下的表
    console.log('\npublic schema 下的表:');
    const publicTables = data.filter(t => t.table_schema === 'public');
    publicTables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

  } catch (error) {
    console.error('列出表失败:', error);
  }
}

// 执行
listAllTables();