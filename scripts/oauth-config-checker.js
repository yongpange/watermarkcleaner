import { createClient } from '@/lib/supabase-client'
import { createServerClient } from '@supabase/ssr'

/**
 * Google OAuth 配置验证和修复脚本
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行此脚本
 * 2. 查看控制台输出的配置建议
 * 3. 根据建议修复Supabase OAuth配置
 */

class OAuthConfigChecker {
  constructor() {
    this.supabase = createClient();
    this.baseUrl = window.location.origin;
    this.locales = ['en', 'zh'];
  }

  // 获取当前locale
  getCurrentLocale() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    return pathSegments[0] || 'en';
  }

  // 生成正确的回调URL
  generateCallbackUrls() {
    const callbackUrls = [];
    
    this.locales.forEach(locale => {
      callbackUrls.push({
        locale,
        url: `${this.baseUrl}/${locale}/auth/callback`,
        display: `http://localhost:3000/${locale}/auth/callback`
      });
    });

    return callbackUrls;
  }

  // 检查OAuth回调URL配置
  checkOAuthConfig() {
    console.group('🔧 Google OAuth 配置检查');
    
    console.log('📍 当前环境信息:');
    console.log(`- 当前URL: ${window.location.href}`);
    console.log(`- 当前Locale: ${this.getCurrentLocale()}`);
    console.log(`- 基础URL: ${this.baseUrl}`);
    
    console.log('\n🎯 需要配置的回调URL:');
    const callbackUrls = this.generateCallbackUrls();
    callbackUrls.forEach(({ locale, url, display }) => {
      console.log(`- ${locale}: ${display}`);
    });

    console.log('\n✅ 正确的redirectTo值:');
    console.log(`- 当前应为: ${this.baseUrl}/${this.getCurrentLocale()}/auth/callback`);
    
    console.log('\n🔍 检查清单:');
    console.log('1. ✅ Supabase项目已启用Google OAuth Provider');
    console.log('2. ✅ Google Cloud Console已配置OAuth 2.0凭据');
    console.log('3. ✅ 所有回调URL都已添加到Google OAuth应用');
    console.log('4. ✅ Supabase的回调URL设置为: https://{project-ref}.supabase.co/auth/v1/callback');
    
    console.log('\n🚀 测试步骤:');
    console.log('1. 点击"Sign in with Google"按钮');
    console.log('2. 验证重定向到Google登录页面');
    console.log('3. 登录后重定向到正确的callback页面');
    console.log('4. 检查用户成功登录');
    
    console.groupEnd();
    
    return callbackUrls;
  }

  // 测试OAuth流程
  async testOAuthFlow() {
    try {
      console.group('🧪 测试OAuth流程');
      
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${this.baseUrl}/${this.getCurrentLocale()}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ OAuth测试失败:', error);
      } else {
        console.log('✅ OAuth测试成功 - 应该会重定向到Google登录页面');
      }
      
      console.groupEnd();
    } catch (error) {
      console.error('❌ OAuth测试异常:', error);
      console.groupEnd();
    }
  }

  // 生成完整的配置指南
  generateConfigGuide() {
    const callbackUrls = this.generateCallbackUrls();
    
    const guide = `
# Google OAuth 配置指南

## 📋 配置文件 (在Supabase Dashboard)

### 1. 启用Google OAuth Provider
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
3. 转到 Authentication > Providers
4. 找到 "Google" 并点击 "Enable"

### 2. 配置回调URL
在Google Cloud Console中，为你的OAuth 2.0 Client添加以下回调URL:

${callbackUrls.map(({ locale, display }) => `**${locale}版本:**\n${display}`).join('\n\n')}

### 3. Supabase回调URL (通常不需要修改)
在Supabase的Google OAuth设置中，确保"Redirect URL"设置为:
\`https://${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname}/auth/v1/callback\`

## 🔍 验证步骤
1. 确认 \`NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true\` 在 .env.local
2. 测试在两个语言版本都能正常登录
3. 检查控制台是否有OAuth相关错误

## 🚨 常见问题
- **404错误**: 确认callback路由存在且正确配置
- **重定向错误**: 检查回调URL是否完全匹配
- **认证失败**: 验证Google OAuth Client ID和Secret正确
    `;
    
    console.log(guide);
    return guide;
  }
}

// 创建全局实例
window.OAuthChecker = new OAuthConfigChecker();

// 自动运行检查
console.log('🔍 正在运行OAuth配置检查...');
window.OAuthChecker.checkOAuthConfig();

export default OAuthConfigChecker;