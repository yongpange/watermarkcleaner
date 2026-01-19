#!/usr/bin/env node

// 验证 NextAuth 环境变量配置
console.log('=== NextAuth 环境变量验证 ===\n');

// 检查必需的环境变量
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allValid = true;

requiredEnvVars.forEach(key => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ 缺少环境变量: ${key}`);
    allValid = false;
  } else {
    const displayValue = key.includes('SECRET') || key.includes('KEY')
      ? `${value.substring(0, 20)}...`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
});

if (!allValid) {
  console.error('\n❌ 环境变量验证失败！请检查 .env.local 文件');
  process.exit(1);
}

// 检查 Google OAuth 客户端 ID 格式
const clientId = process.env.GOOGLE_CLIENT_ID;
if (!clientId?.endsWith('.apps.googleusercontent.com')) {
  console.error('\n⚠️ 警告: GOOGLE_CLIENT_ID 格式可能不正确');
  console.error('应该类似于: xxxxxx.apps.googleusercontent.com');
}

// 检查 NEXTAUTH_URL
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (!nextAuthUrl?.startsWith('http://localhost:3000') && !nextAuthUrl?.startsWith('https://')) {
  console.error('\n⚠️ 警告: NEXTAUTH_URL 应该包含协议 (http:// 或 https://)');
}

console.log('\n✅ 环境变量验证通过！');
process.exit(0);
