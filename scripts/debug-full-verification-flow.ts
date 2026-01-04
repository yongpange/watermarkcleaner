/**
 * 完整验证码流程调试脚本
 *
 * 这个脚本模拟完整的验证码发送和验证流程，用于诊断问题
 */

import { createAdminClient } from '../src/lib/supabase-admin';
import { generateVerificationCode, verifyCode } from '../src/lib/auth/verification';
import * as dotenv from 'dotenv';
import { sendVerificationEmail } from '../src/lib/email/resend';

dotenv.config({ path: '.env.local' });

// 测试配置
const TEST_EMAIL = 'debug_test_' + Date.now() + '@example.com';
const TEST_PURPOSE = 'login';

async function debugFullFlow() {
  console.log('🔍 开始完整验证码流程调试\n');
  console.log('='.repeat(80));

  const supabase = createAdminClient();

  // ============================================================================
  // 阶段 1: 生成和存储验证码
  // ============================================================================
  console.log('\n📧 阶段 1: 生成和存储验证码');
  console.log('-'.repeat(80));

  // 1.1 生成验证码
  const code = generateVerificationCode();
  console.log(`✅ 生成的验证码: ${code}`);
  console.log(`✅ 验证码长度: ${code.length} 位`);
  console.log(`✅ 验证码格式 (纯数字): ${/^\d+$/.test(code)}`);

  // 1.2 存储验证码
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  console.log(`\n💾 准备存储数据:`);
  console.log(`   - Email: ${TEST_EMAIL}`);
  console.log(`   - Code: ${code}`);
  console.log(`   - Purpose: ${TEST_PURPOSE}`);
  console.log(`   - Expires At: ${expiresAt.toISOString()}`);
  console.log(`   - Current Time: ${new Date().toISOString()}`);

  const insertPayload = {
    email: TEST_EMAIL,
    code,
    purpose: TEST_PURPOSE,
    expires_at: expiresAt.toISOString(),
  };

  const { data: insertedRecord, error: insertError } = await supabase
    .from('wmc_email_verification_codes')
    .insert(insertPayload as any)
    .select()
    .single();

  if (insertError) {
    console.error(`\n❌ 存储验证码失败:`, insertError);
    return;
  }

  console.log(`\n✅ 验证码存储成功!`);
  console.log(`   - Record ID: ${insertedRecord.id}`);
  console.log(`   - Created At (from DB): ${insertedRecord.created_at}`);
  console.log(`   - Created At (local): ${new Date(insertedRecord.created_at).toString()}`);
  console.log(`   - Expires At (from DB): ${insertedRecord.expires_at}`);
  console.log(`   - Expires At (local): ${new Date(insertedRecord.expires_at).toString()}`);

  // 1.3 验证时间计算
  const now = new Date();
  const dbCreatedAt = new Date(insertedRecord.created_at);
  const dbExpiresAt = new Date(insertedRecord.expires_at);
  const timeSinceCreated = (now.getTime() - dbCreatedAt.getTime()) / 1000;
  const timeUntilExpire = (dbExpiresAt.getTime() - now.getTime()) / 1000;

  console.log(`\n⏰ 时间分析:`);
  console.log(`   - 距创建时间: ${timeSinceCreated.toFixed(2)} 秒`);
  console.log(`   - 剩余有效时间: ${(timeUntilExpire / 60).toFixed(2)} 分钟 (${timeUntilExpire.toFixed(2)} 秒)`);

  // ============================================================================
  // 阶段 2: 立即验证（模拟用户快速输入）
  // ============================================================================
  console.log('\n\n🔐 阶段 2: 立即验证（模拟用户快速输入）');
  console.log('-'.repeat(80));

  const immediateResult = await verifyCode(TEST_EMAIL, code, TEST_PURPOSE);
  console.log(`✅ 验证结果: ${immediateResult.valid ? '成功' : '失败'}`);
  console.log(`✅ 失败原因: ${immediateResult.reason || '无'}`);

  if (immediateResult.record) {
    console.log(`✅ 找到的记录 ID: ${immediateResult.record.id}`);
  }

  // ============================================================================
  // 阶段 3: 模拟错误的验证码
  // ============================================================================
  console.log('\n\n❌ 阶段 3: 测试错误验证码');
  console.log('-'.repeat(80));

  const wrongCode = '000000';
  const wrongResult = await verifyCode(TEST_EMAIL, wrongCode, TEST_PURPOSE);
  console.log(`✅ 验证结果: ${wrongResult.valid ? '成功' : '失败'}`);
  console.log(`✅ 失败原因: ${wrongResult.reason || '无'}`);

  // ============================================================================
  // 阶段 4: 查询数据库验证数据完整性
  // ============================================================================
  console.log('\n\n🗄️  阶段 4: 数据库数据完整性检查');
  console.log('-'.repeat(80));

  // 4.1 按邮箱和最新创建时间查询
  const { data: latestRecord, error: queryError } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', TEST_EMAIL)
    .order('created_at', { ascending: false })
    .limit(1);

  if (queryError || !latestRecord || latestRecord.length === 0) {
    console.error('❌ 查询最新记录失败:', queryError || '未找到记录');
    return;
  }

  const record = latestRecord[0];
  console.log(`✅ 查询到最新记录:`);
  console.log(`   - ID: ${record.id}`);
  console.log(`   - Email: ${record.email}`);
  console.log(`   - Code: ${record.code}`);
  console.log(`   - Purpose: ${record.purpose}`);
  console.log(`   - Attempts: ${record.attempts}`);
  console.log(`   - Used: ${record.used}`);
  console.log(`   - Created At: ${record.created_at}`);
  console.log(`   - Expires At: ${record.expires_at}`);

  // 4.2 验证字段格式
  console.log(`\n✅ 字段格式验证:`);
  console.log(`   - Code 是纯数字: ${/^\d+$/.test(record.code)}`);
  console.log(`   - Code 长度: ${record.code.length}`);
  console.log(`   - Email 格式正确: ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)}`);
  console.log(`   - Purpose 有效: ${['register', 'login', 'update_email'].includes(record.purpose)}`);
  console.log(`   - Attempts 是数字: ${typeof record.attempts === 'number'}`);
  console.log(`   - Used 是布尔值: ${typeof record.used === 'boolean'}`);

  // 4.3 验证时间格式
  console.log(`\n✅ 时间格式验证:`);
  const createdAtValid = !isNaN(new Date(record.created_at).getTime());
  const expiresAtValid = !isNaN(new Date(record.expires_at).getTime());
  console.log(`   - Created At 是有效时间: ${createdAtValid}`);
  console.log(`   - Expires At 是有效时间: ${expiresAtValid}`);

  if (createdAtValid && expiresAtValid) {
    const created = new Date(record.created_at);
    const expires = new Date(record.expires_at);
    const duration = (expires.getTime() - created.getTime()) / (1000 * 60);
    console.log(`   - 有效时长: ${duration} 分钟`);
    console.log(`   - 预期时长: 15 分钟`);
    console.log(`   - 时长正确: ${Math.abs(duration - 15) < 0.1}`);
  }

  // ============================================================================
  // 阶段 5: 测试不同的 purpose
  // ============================================================================
  console.log('\n\n🎯 阶段 5: 测试不同的 purpose 值');
  console.log('-'.repeat(80));

  const purposes = ['register', 'login', 'update_email'];
  for (const testPurpose of purposes) {
    console.log(`\n  测试 Purpose: ${testPurpose}`);
    const result = await verifyCode(TEST_EMAIL, code, testPurpose as any);
    console.log(`  - 结果: ${result.valid ? '成功' : '失败'}`);
    console.log(`  - 原因: ${result.reason || '无'}`);

    if (result.record && result.record.purpose !== testPurpose) {
      console.log(`  - ⚠️  Purpose 不匹配: 期望 ${testPurpose}, 实际 ${result.record.purpose}`);
    }
  }

  // ============================================================================
  // 阶段 6: 测试大小写和空白字符
  // ============================================================================
  console.log('\n\n📝 阶段 6: 测试输入格式敏感度');
  console.log('-'.repeat(80));

  const formatTests = [
    { code: code.toUpperCase(), name: '大写字母' }, // 虽然应该是数字，但测试一下
    { code: ` ${code} `, name: '前后空格' },
    { code: code.trim(), name: '去除空格' },
    { code: code, email: TEST_EMAIL.toUpperCase(), name: '邮箱大写' },
  ];

  for (const test of formatTests) {
    const testCode = test.code;
    const testEmail = test.email || TEST_EMAIL;
    console.log(`\n  测试: ${test.name}`);
    console.log(`  - Code: "${testCode}"`);
    console.log(`  - Email: "${testEmail}"`);

    const result = await verifyCode(testEmail, testCode, TEST_PURPOSE);
    console.log(`  - 结果: ${result.valid ? '成功' : '失败'}`);
    console.log(`  - 原因: ${result.reason || '无'}`);
  }

  // ============================================================================
  // 阶段 7: 模拟实际登录流程
  // ============================================================================
  console.log('\n\n🚀 阶段 7: 模拟实际登录流程');
  console.log('-'.repeat(80));

  // 清空尝试次数
  console.log('第一步: 重置尝试次数...');
  const { error: resetError } = await supabase
    .from('wmc_email_verification_codes')
    .update({ attempts: 0 })
    .eq('id', record.id);

  if (resetError) {
    console.error('重置失败:', resetError);
  } else {
    console.log('✅ 尝试次数已重置');
  }

  // 第二次验证（模拟用户收到邮件后输入）
  console.log('\n第二步: 重新验证（模拟用户输入）...');
  const secondResult = await verifyCode(TEST_EMAIL, code, TEST_PURPOSE);
  console.log(`✅ 结果: ${secondResult.valid ? '成功' : '失败'}`);
  console.log(`✅ 原因: ${secondResult.reason || '无'}`);

  if (secondResult.valid) {
    console.log('\n第三步: 查询用户信息（模拟登录后）...');
    const { data: user } = await supabase
      .from('wmc_users')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    if (user) {
      console.log(`✅ 找到用户: ${user.id}`);
      console.log(`✅ 用户名: ${user.name}`);
      console.log(`✅ 等级: ${user.tier}`);
    } else {
      console.log('ℹ️  用户不存在（预期，因为是测试邮箱）');
    }
  }

  // ============================================================================
  // 清理（可选）
  // ============================================================================
  console.log('\n\n🧹 清理测试数据');
  console.log('-'.repeat(80));

  const { error: cleanupError } = await supabase
    .from('wmc_email_verification_codes')
    .delete()
    .eq('email', TEST_EMAIL);

  if (cleanupError) {
    console.error('❌ 清理失败:', cleanupError);
  } else {
    console.log('✅ 测试数据已清理');
  }

  // ============================================================================
  // 总结
  // ============================================================================
  console.log('\n\n📊 调试总结');
  console.log('='.repeat(80));
  console.log('\n流程完成！请检查以上输出中的:\n');
  console.log('1. ✅ 时间戳是否正确（时差是否正常）');
  console.log('2. ✅ 验证码格式是否正确（6位数字）');
  console.log('3. ✅ Purpose 是否一致');
  console.log('4. ✅ 数据库记录是否完整');
  console.log('5. ✅ 验证逻辑是否正确');
  console.log('\n如果以上都正常，问题可能在:');
  console.log('- 邮件发送过程中的代码变更');
  console.log('- 前端显示和实际发送的代码不一致');
  console.log('- 多实例环境下的数据同步问题');
}

// 运行调试
debugFullFlow().catch(err => {
  console.error('❌ 调试过程出错:', err);
  process.exit(1);
});
