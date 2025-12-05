#!/usr/bin/env node

/**
 * Google登录404错误修复测试脚本
 * 
 * 此脚本测试修复后的Google登录功能是否正常工作
 * 
 * 使用方法：
 * 1. 启动开发服务器: npm run dev
 * 2. 在另一个终端运行: node scripts/test-oauth-fix.js
 * 3. 按照脚本提示进行手动测试
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class OAuthFixTester {
  constructor() {
    this.testResults = {
      routeStructure: false,
      redirectUrlLogic: false,
      environmentVars: false,
      oauthConfig: false
    };
  }

  // 测试路由结构
  async testRouteStructure() {
    console.log('\n🧪 测试1: 国际化路由结构');
    
    const callbackPath = path.join(projectRoot, 'src', 'app', '[locale]', 'auth', 'callback', 'page.tsx');
    
    if (fs.existsSync(callbackPath)) {
      const content = fs.readFileSync(callbackPath, 'utf-8');
      
      // 检查关键组件是否存在
      const hasLocaleParam = content.includes('const { locale }') || content.includes('await params');
      const hasSearchParams = content.includes('searchParams');
      const hasAuthHandling = content.includes('supabase.auth.exchangeCodeForSession');
      const hasErrorHandling = content.includes('auth/signin');
      
      if (hasLocaleParam && hasSearchParams && hasAuthHandling && hasErrorHandling) {
        console.log('✅ 路由结构测试通过');
        console.log('   - 包含locale参数处理');
        console.log('   - 包含searchParams处理');
        console.log('   - 包含OAuth回调处理');
        console.log('   - 包含错误重定向');
        this.testResults.routeStructure = true;
      } else {
        console.log('❌ 路由结构测试失败 - 缺少关键组件');
        if (!hasLocaleParam) console.log('   - 缺少locale参数处理');
        if (!hasSearchParams) console.log('   - 缺少searchParams处理');
        if (!hasAuthHandling) console.log('   - 缺少OAuth回调处理');
        if (!hasErrorHandling) console.log('   - 缺少错误重定向');
      }
    } else {
      console.log('❌ 路由结构测试失败 - 回调页面不存在');
    }
  }

  // 测试重定向URL逻辑
  async testRedirectUrlLogic() {
    console.log('\n🧪 测试2: OAuth重定向URL逻辑');
    
    const filesToCheck = [
      path.join(projectRoot, 'src', 'components', 'sign', 'form.tsx'),
      path.join(projectRoot, 'src', 'components', 'sign', 'modal.tsx')
    ];
    
    let allCorrect = true;
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasCorrectRedirect = content.includes('/${locale}/auth/callback');
        const hasLocaleExtraction = content.includes('pathname.split');
        
        if (hasCorrectRedirect && hasLocaleExtraction) {
          console.log(`✅ ${path.basename(filePath)} 重定向逻辑正确`);
        } else {
          console.log(`❌ ${path.basename(filePath)} 重定向逻辑需要修复`);
          if (!hasCorrectRedirect) console.log('   - 缺少正确的locale路径');
          if (!hasLocaleExtraction) console.log('   - 缺少locale提取逻辑');
          allCorrect = false;
        }
      }
    }
    
    this.testResults.redirectUrlLogic = allCorrect;
  }

  // 测试环境变量配置
  async testEnvironmentVars() {
    console.log('\n🧪 测试3: 环境变量配置');
    
    const envPath = path.join(projectRoot, '.env.local');
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      
      const checks = {
        'NEXT_PUBLIC_SUPABASE_URL': content.includes('NEXT_PUBLIC_SUPABASE_URL'),
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        'NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true': content.includes('NEXT_PUBLIC_AUTH_GOOGLE_ENABLED="true"') || content.includes('NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true')
      };
      
      let allPassed = true;
      Object.entries(checks).forEach(([key, passed]) => {
        if (passed) {
          console.log(`✅ ${key} 配置正确`);
        } else {
          console.log(`❌ ${key} 配置缺失或错误`);
          allPassed = false;
        }
      });
      
      this.testResults.environmentVars = allPassed;
    } else {
      console.log('❌ .env.local 文件不存在');
      this.testResults.environmentVars = false;
    }
  }

  // 测试OAuth配置检查脚本
  async testOAuthConfig() {
    console.log('\n🧪 测试4: OAuth配置检查脚本');
    
    const configScriptPath = path.join(projectRoot, 'scripts', 'oauth-config-checker.js');
    
    if (fs.existsSync(configScriptPath)) {
      console.log('✅ OAuth配置检查脚本存在');
      console.log('   - 在浏览器控制台运行 window.OAuthChecker.checkOAuthConfig()');
      this.testResults.oauthConfig = true;
    } else {
      console.log('❌ OAuth配置检查脚本不存在');
      this.testResults.oauthConfig = false;
    }
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 测试报告');
    console.log('================');
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(Boolean).length;
    
    Object.entries(this.testResults).forEach(([testName, passed]) => {
      const status = passed ? '✅ 通过' : '❌ 失败';
      const testNameCN = {
        'routeStructure': '国际化路由结构',
        'redirectUrlLogic': 'OAuth重定向URL逻辑',
        'environmentVars': '环境变量配置',
        'oauthConfig': 'OAuth配置检查脚本'
      }[testName] || testName;
      
      console.log(`${testNameCN}: ${status}`);
    });
    
    console.log(`\n总进度: ${passedTests}/${totalTests} 项测试通过`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 所有修复都成功完成！');
      console.log('\n📝 下一步操作:');
      console.log('1. 启动开发服务器: npm run dev');
      console.log('2. 访问 http://localhost:3000');
      console.log('3. 在浏览器控制台运行: window.OAuthChecker.checkOAuthConfig()');
      console.log('4. 测试两个语言版本的Google登录');
    } else {
      console.log('\n⚠️  还有未完成的修复项，请检查上述失败项目');
    }
  }

  // 生成手动测试指南
  generateManualTestGuide() {
    const guide = `
# 🔧 Google登录404错误修复 - 手动测试指南

## 修复摘要
✅ 已完成的修复:
1. 创建了国际化的OAuth回调页面: \`/[locale]/auth/callback/page.tsx\`
2. 修复了OAuth重定向URL逻辑，包含正确的locale参数
3. 验证了环境变量配置
4. 创建了OAuth配置检查工具

## 🚀 手动测试步骤

### 1. 启动应用
\`\`\`bash
npm run dev
\`\`\`

### 2. 在浏览器中测试
1. 打开 http://localhost:3000
2. 按F12打开开发者工具
3. 在控制台中运行:
   \`\`\`javascript
   window.OAuthChecker.checkOAuthConfig()
   \`\`\`

### 3. 测试英语版本
1. 访问 http://localhost:3000/en
2. 点击 "Sign in with Google"
3. 应该重定向到Google登录页面（不再出现404）

### 4. 测试中文版本
1. 访问 http://localhost:3000/zh
2. 点击 "使用Google登录"
3. 应该重定向到Google登录页面（不再出现404）

### 5. 测试OAuth回调
1. 完成Google登录流程
2. 应该重定向到 \`/en/auth/callback\` 或 \`/zh/auth/callback\`
3. 不应该出现404错误

## 🔍 检查清单
- [ ] 启动服务器无错误
- [ ] 英语版本Google登录无404
- [ ] 中文版本Google登录无404  
- [ ] OAuth回调正常工作
- [ ] 用户能成功登录

## 🚨 如果仍有问题
1. 检查浏览器控制台错误
2. 验证Supabase OAuth配置
3. 确认Google Cloud Console回调URL设置
4. 查看网络请求日志
    `;
    
    console.log('\n📖 手动测试指南已生成');
    
    // 保存指南到文件
    const guidePath = path.join(projectRoot, 'MANUAL_TEST_GUIDE.md');
    fs.writeFileSync(guidePath, guide);
    console.log(`📁 测试指南已保存到: ${guidePath}`);
    
    return guide;
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始测试Google登录404错误修复...');
    
    await this.testRouteStructure();
    await this.testRedirectUrlLogic();
    await this.testEnvironmentVars();
    await this.testOAuthConfig();
    
    this.generateReport();
    this.generateManualTestGuide();
  }
}

// 运行测试
const tester = new OAuthFixTester();
tester.runAllTests().catch(console.error);