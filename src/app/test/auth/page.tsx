// 测试页面 - 验证认证组件功能
// 访问：http://localhost:3002/test/auth

'use client';

import { useState } from 'react';
import { AuthModal } from '../../../components/auth/auth-modal';
import { AppleButton } from '../../../components/auth/apple-style/button';
import { AppleInput } from '../../../components/auth/apple-style/input';

export default function AuthTestPage() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMagicModal, setShowMagicModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">认证系统测试页面</h1>

        {/* 状态指示器 */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">🚀 系统状态</h2>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>✅ 数据库迁移文件已创建</li>
            <li>✅ 后端API接口已就绪</li>
            <li>✅ 前端组件库已构建</li>
            <li>✅ NextAuth配置已更新</li>
          </ul>
        </div>

        {/* 功能测试区域 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 邮箱验证码测试 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">邮箱验证码登录</h2>
            <p className="text-sm text-gray-600 mb-4">支持注册和登录的双功能模式</p>

            <AppleButton onClick={() => setShowEmailModal(true)}>打开邮箱验证码弹窗</AppleButton>

            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">特性：</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✓ 实时用户存在性检查</li>
                <li>✓ 6位数字验证码</li>
                <li>✓ 60秒倒计时</li>
                <li>✓ 验证码自动跳转</li>
              </ul>
            </div>
          </div>

          {/* Magic Link测试 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">邮箱链接登录</h2>
            <p className="text-sm text-gray-600 mb-4">传统Magic Link认证方式</p>

            <AppleButton onClick={() => setShowMagicModal(true)} variant="secondary">
              打开邮箱链接弹窗
            </AppleButton>

            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">特性：</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✓ 发送登录链接到邮箱</li>
                <li>✓ 点击链接自动登录</li>
                <li>✓ 无需记住密码</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 测试输入框 */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">组件测试</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <AppleInput label="Apple风格输入框" placeholder="测试输入" fullWidth />
            <AppleButton fullWidth>Apple风格按钮</AppleButton>
          </div>
        </div>

        {/* 动画展示 */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">动画效果</h2>
          <p className="text-sm text-gray-600">点击上方按钮查看弹窗动画效果</p>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-gray-50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📖 使用步骤</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              确保已配置 .env.local 中的环境变量
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              在 Supabase 控制台执行数据库迁移
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              点击上方按钮测试弹窗功能
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              输入真实邮箱测试邮件发送
            </li>
          </ol>
        </div>

        {/* 注意事项 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ 注意事项</h2>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>• 测试邮箱验证码功能需要有效的 Resend API Key</li>
            <li>• 确保数据库表已创建（wmc_email_verification_codes）</li>
            <li>• 检查 Supabase 连接是否正常</li>
            <li>• 查看浏览器控制台日志获取详细信息</li>
          </ul>
        </div>

        {/* 组件状态指示器 */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-xl">
            <h3 className="font-semibold text-green-800">✅ 已完成</h3>
            <p className="text-sm text-green-700">所有组件和API已实现</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl">
            <h3 className="font-semibold text-blue-800">🔧 需要配置</h3>
            <p className="text-sm text-blue-700">环境变量和数据库</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl">
            <h3 className="font-semibold text-purple-800">🧪 待测试</h3>
            <p className="text-sm text-purple-700">点击上方按钮测试</p>
          </div>
        </div>
      </div>

      {/* 弹窗组件 */}
      <AuthModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} defaultMode="email-code" />
      <AuthModal isOpen={showMagicModal} onClose={() => setShowMagicModal(false)} defaultMode="magic-link" />
    </div>
  );
}
