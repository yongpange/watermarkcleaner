#!/usr/bin/env node

/**
 * 测试 Resend 邮件配置
 *
 * 使用方法：
 * 1. 确保 .env.local 中配置了 RESEND_API_KEY
 * 2. 运行：node test-resend.js 你的测试邮箱@example.com
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

async function testResend(testEmail) {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   测试 Resend 邮件配置                     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // 1. 检查环境变量
  console.log('🔍 检查环境变量...');
  console.log('   API Key:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 10)}...` : '❌ 未找到');
  console.log('   From:', EMAIL_FROM);
  console.log('   To:', testEmail, '\n');

  if (!RESEND_API_KEY) {
    console.error('❌ 错误: RESEND_API_KEY 未设置');
    console.log('\n💡 请检查 .env.local 文件\n');
    process.exit(1);
  }

  if (!testEmail) {
    console.error('❌ 错误: 请提供测试邮箱');
    console.log('\n💡 使用方法: node test-resend.js your-email@example.com\n');n    process.exit(1);
  }

  // 2. 初始化 Resend
  console.log('📧 初始化 Resend...\n');
  const resend = new Resend(RESEND_API_KEY);

  // 3. 发送测试邮件
  console.log('📤 发送测试邮件...\n');
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: testEmail,
      subject: '🧪 测试：WatermarkCleaner 邮件验证',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h1 style="color: #6366f1; margin-bottom: 20px;">✅ 测试成功！</h1>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">📊 配置信息</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>发送方：</strong> ${EMAIL_FROM}</li>
              <li><strong>接收方：</strong> ${testEmail}</li>
              <li><strong>时间：</strong> ${new Date().toLocaleString('zh-CN')}</li>
              <li><strong>状态：</strong> ✅ 配置正确</li>
            </ul>
          </div>

          <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1d4ed8;">🎯 下一步</h3>
            <p style="margin: 10px 0; color: #374151;">现在可以测试完整的邮箱验证流程了！</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #6b7280; font-size: 14px;">WatermarkCleaner - AI 智能去水印工具</p>
            <p style="color: #9ca3af; font-size: 12px;">测试邮件，无需回复</p>
          </div>
        </div>
      `,
    });

    // 4. 检查结果
    if (error) {
      console.error('❌ 邮件发送失败:\n');
      console.error('   错误信息:', error.message);
      console.error('\n💡 解决方案:\n');

      if (error.message.includes('401')) {
        console.error('   - API Key 无效，请获取新的 API Key');
        console.error('   - 网址: https://resend.com/api-keys\n');
      } else if (error.message.includes('403')) {
        console.error('   - 域名未验证');
        console.error('   - 请验证域名或使用 onboarding@resend.dev');
        console.error('   - 网址: https://resend.com/domains\n');
      } else {
        console.error('   - 错误:', error.message);
      }

      process.exit(1);
    }

    // 5. 成功
    console.log('✅ 邮件发送成功！\n');
    console.log('📧 邮件详情:\n');
    console.log('   邮件 ID:', data.id);
    console.log('   状态:', '已发送');
    console.log('   收件人:', testEmail);
    console.log('\n💡 请检查你的邮箱（包括垃圾邮件文件夹）\n');

    // 6. 提供后续步骤
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🎉 下一步：测试邮箱验证流程           ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log('步骤 1: 启动应用\n   npm run dev\n');
    console.log('步骤 2: 访问 http://localhost:3000\n');
    console.log('步骤 3: 点击登录/注册\n');
    console.log('步骤 4: 输入邮箱，点击发送验证邮件\n');
    console.log('步骤 5: 检查邮箱并点击验证链接\n');
    console.log('步骤 6: 验证成功后，额度应该从 3张 增加到 10张\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('\n💡 可能原因:\n');
    console.error('   - 网络连接失败');
    console.error('   - Resend API 服务不可用');
    console.error('   - API Key 格式错误\n');
    process.exit(1);
  }
}

// 获取命令行参数
const testEmail = process.argv[2];

testResend(testEmail).catch(console.error);
