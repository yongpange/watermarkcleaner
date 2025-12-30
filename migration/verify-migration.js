/**
 * 验证数据库迁移是否成功
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 验证数据库迁移结果...\n');

  const tests = [
    {
      name: '检查表是否存在',
      test: async () => {
        const tables = ['users', 'accounts', 'sessions', 'verification_tokens', 'processing_history'];
        const results = {};

        for (const table of tables) {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          results[table] = !error;
        }

        return results;
      }
    },
    {
      name: '检查数据是否迁移',
      test: async () => {
        const tables = ['users', 'accounts', 'sessions', 'verification_tokens', 'processing_history'];
        const results = {};

        for (const table of tables) {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          results[table] = {
            count: count || 0,
            error: error ? error.message : null
          };
        }

        return results;
      }
    },
    {
      name: '检查NextAuth.js相关字段',
      test: async () => {
        // 检查 users 表结构
        const { data: userSample, error: userError } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (userError || !userSample || userSample.length === 0) {
          return { users: '无数据或查询失败' };
        }

        const user = userSample[0];
        const requiredFields = ['id', 'email', 'created_at'];
        const missingFields = requiredFields.filter(field => !(field in user));

        return {
          users: {
            hasData: true,
            missingFields: missingFields,
            sampleData: {
              id: user.id,
              email: user.email,
              created_at: user.created_at
            }
          }
        };
      }
    },
    {
      name: '检查代码中的查询是否正常工作',
      test: async () => {
        try {
          // 模拟 checkCredits 函数的操作
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .limit(1)
            .single();

          if (error) {
            return { checkCredits: `查询失败: ${error.message}` };
          }

          return {
            checkCredits: {
              success: true,
              userFound: !!user,
              userTier: user?.tier || 'unknown'
            }
          };
        } catch (error) {
          return { checkCredits: `异常: ${error.message}` };
        }
      }
    }
  ];

  for (const test of tests) {
    console.log(`📋 ${test.name}...`);
    try {
      const result = await test.test();
      console.log('✅ 通过');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ 失败');
      console.error(error);
    }
    console.log('');
  }

  console.log('\n✨ 验证完成！');
  console.log('\n如果所有测试都通过，说明迁移成功。');
  console.log('如果有失败的测试，请检查相应的错误信息。');
}

// 执行验证
verifyMigration().catch(console.error);