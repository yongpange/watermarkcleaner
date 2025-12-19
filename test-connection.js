// 测试数据库连接
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  // 尝试不同的连接字符串格式
  const connections = [
    // 格式1: 标准格式
    "postgresql://postgres.fangjin520201103:YOUR_PASSWORD@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=require",

    // 格式2: 使用host参数
    "postgresql://postgres.fangjin520201103:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",

    // 格式3: 使用host参数 + 连接池
    "postgresql://postgres.fangjin520201103:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true",

    // 格式4: 禁用SSL（仅测试）
    "postgresql://postgres.fangjin520201103:YOUR_PASSWORD@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=disable",
  ];

  for (let i = 0; i < connections.length; i++) {
    console.log(`\n🔍 测试连接 ${i + 1}:`);
    console.log(connections[i].replace(/:([^:@\/]+)@/, ":***@")); // 隐藏密码

    try {
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: connections[i],
          },
        },
      });

      // 测试简单查询
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ 连接成功！');
      console.log('结果:', result);

      await prisma.$disconnect();
      return connections[i];
    } catch (error) {
      console.log('❌ 连接失败:', error.message);
    }
  }

  console.log('\n💡 请在 Supabase 控制台检查:');
  console.log('1. Database -> Connection pooling 是否启用');
  console.log('2. Settings -> Network 中的 IP 白名单');
  console.log('3. 使用 "Test connection" 按钮测试');

  return null;
}

testConnection().catch(console.error);
