/**
 * 数据库诊断脚本
 * 用于检查 Supabase 数据库连接、表结构和 RLS 策略
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Supabase 数据库诊断工具\n');
  console.log('📋 配置信息:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');

  // 1. 测试数据库连接
  console.log('1️⃣  测试数据库连接...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('   ❌ 连接失败:', error.message);
    } else {
      console.log('   ✅ 数据库连接成功');
    }
  } catch (err) {
    console.error('   ❌ 连接异常:', err);
  }
  console.log('');

  // 2. 检查表是否存在
  console.log('2️⃣  检查关键表是否存在...');
  const tables = ['conversions', 'chat_sessions', 'flashcards'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table as string).select('count').limit(1);
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ❌ ${table} - 表不存在`);
        } else {
          console.log(`   ⚠️  ${table} - ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table} - 表存在`);
      }
    } catch (err: unknown) {
      console.log(`   ❌ ${table} - 检查失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log('');

  // 3. 测试匿名用户插入权限（flashcards）
  console.log('3️⃣  测试匿名用户插入权限 (flashcards)...');
  try {
    const testData = {
      uuid: `test-${Date.now()}`,
      user_uuid: null,
      file_id: 'test-file-id',
      question: 'Test Question',
      answer: 'Test Answer',
      explanation: 'Test Explanation',
      source: 'ai',
      order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data, error } = await supabase
      .from('flashcards')
      .insert(testData)
      .select();

    if (error) {
      console.log('   ❌ 插入失败:', error.message);
      console.log('   详细信息:', error);
    } else {
      console.log('   ✅ 插入成功');
      console.log('   插入的数据:', data);
      
      // 清理测试数据
      if (data && data.length > 0) {
        await supabase.from('flashcards').delete().eq('uuid', testData.uuid);
        console.log('   🧹 测试数据已清理');
      }
    }
  } catch (err: unknown) {
    console.log('   ❌ 测试异常:', err instanceof Error ? err.message : String(err));
  }
  console.log('');

  // 4. 测试匿名用户插入权限（chat_sessions）
  console.log('4️⃣  测试匿名用户插入权限 (chat_sessions)...');
  try {
    const testData = {
      uuid: `test-${Date.now()}`,
      user_uuid: null,
      file_id: 'test-file-id',
      messages: [
        { role: 'user', content: 'Test message', timestamp: new Date().toISOString() }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message_count: 1,
      last_message_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(testData)
      .select();

    if (error) {
      console.log('   ❌ 插入失败:', error.message);
      console.log('   详细信息:', error);
    } else {
      console.log('   ✅ 插入成功');
      console.log('   插入的数据:', data);
      
      // 清理测试数据
      if (data && data.length > 0) {
        await supabase.from('chat_sessions').delete().eq('uuid', testData.uuid);
        console.log('   🧹 测试数据已清理');
      }
    }
  } catch (err: unknown) {
    console.log('   ❌ 测试异常:', err instanceof Error ? err.message : String(err));
  }
  console.log('');

  // 5. 测试匿名用户插入权限（conversions）
  console.log('5️⃣  测试匿名用户插入权限 (conversions)...');
  try {
    const testData = {
      uuid: `test-${Date.now()}`,
      user_uuid: null,
      file_id: 'test-file-id',
      file_name: 'test.txt',
      file_size: 1024,
      file_type: 'text/plain',
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data, error } = await supabase
      .from('conversions')
      .insert(testData)
      .select();

    if (error) {
      console.log('   ❌ 插入失败:', error.message);
      console.log('   详细信息:', error);
    } else {
      console.log('   ✅ 插入成功');
      console.log('   插入的数据:', data);
      
      // 清理测试数据
      if (data && data.length > 0) {
        await supabase.from('conversions').delete().eq('uuid', testData.uuid);
        console.log('   🧹 测试数据已清理');
      }
    }
  } catch (err: unknown) {
    console.log('   ❌ 测试异常:', err.message);
  }
  console.log('');

  // 6. 查询现有数据统计
  console.log('6️⃣  查询现有数据统计...');
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table as string)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: 查询失败 - ${error.message}`);
      } else {
        console.log(`   📊 ${table}: ${count || 0} 条记录`);
      }
    } catch (err: any) {
      console.log(`   ❌ ${table}: 查询异常 - ${err.message}`);
    }
  }
  console.log('');

  console.log('✅ 诊断完成！\n');
  console.log('📝 建议：');
  console.log('   1. 如果表不存在，请执行 scripts/sql/supabase_init.sql');
  console.log('   2. 如果插入失败，检查 RLS 策略是否正确配置');
  console.log('   3. 如果连接失败，检查 .env.local 中的 Supabase 配置');
}

main().catch(console.error);

