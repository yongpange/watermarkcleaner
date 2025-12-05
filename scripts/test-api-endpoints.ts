/**
 * API 端点测试脚本
 * 模拟前端调用 API 保存数据的完整流程
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

async function testFlashcardsAPI() {
  console.log('\n1️⃣  测试 Flashcards API...');
  
  const testFileId = `test-file-${Date.now()}`;
  const testFlashcards = [
    {
      question: '什么是 React？',
      answer: 'React 是一个用于构建用户界面的 JavaScript 库',
      explanation: 'React 由 Facebook 开发，专注于构建可复用的 UI 组件',
      order: 0,
      source: 'ai',
    },
    {
      question: '什么是 Next.js？',
      answer: 'Next.js 是一个基于 React 的全栈框架',
      explanation: 'Next.js 提供了服务端渲染、静态生成等功能',
      order: 1,
      source: 'ai',
    },
  ];

  try {
    // 保存闪卡
    console.log('   📤 POST /api/flashcards');
    const saveResponse = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: testFileId,
        flashcards: testFlashcards,
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.log('   ❌ 保存失败:', saveResponse.status, errorText);
      return;
    }

    const saveData = await saveResponse.json();
    console.log('   ✅ 保存成功:', saveData.data.count, '个闪卡');
    console.log('   📊 返回数据:', JSON.stringify(saveData, null, 2));

    // 读取闪卡
    console.log('   📥 GET /api/flashcards?fileId=' + testFileId);
    const loadResponse = await fetch(`${BASE_URL}/api/flashcards?fileId=${testFileId}`);
    
    if (!loadResponse.ok) {
      const errorText = await loadResponse.text();
      console.log('   ❌ 读取失败:', loadResponse.status, errorText);
      return;
    }

    const loadData = await loadResponse.json();
    console.log('   ✅ 读取成功:', loadData.data.count, '个闪卡');
    console.log('   📊 闪卡列表:', loadData.data.flashcards.map((c: Record<string, unknown>) => (c as { question: string }).question));

  } catch (error) {
    console.log('   ❌ 测试异常:', error);
  }
}

async function testChatSessionAPI() {
  console.log('\n2️⃣  测试 Chat Session API...');
  
  const testFileId = `test-file-${Date.now()}`;
  const testMessages = [
    {
      role: 'user',
      content: '你好，请帮我总结这个文档',
      timestamp: new Date().toISOString(),
    },
    {
      role: 'assistant',
      content: '好的，我来帮你总结...',
      timestamp: new Date().toISOString(),
    },
  ];

  try {
    // 保存聊天会话
    console.log('   📤 POST /api/workspace/chat-session');
    const saveResponse = await fetch(`${BASE_URL}/api/workspace/chat-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: testFileId,
        messages: testMessages,
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.log('   ❌ 保存失败:', saveResponse.status, errorText);
      return;
    }

    const saveData = await saveResponse.json();
    console.log('   ✅ 保存成功');
    console.log('   📊 Session UUID:', saveData.data.sessionUuid);
    console.log('   📊 消息数量:', saveData.data.messageCount);

    // 读取聊天会话
    console.log('   📥 GET /api/workspace/chat-session?fileId=' + testFileId);
    const loadResponse = await fetch(`${BASE_URL}/api/workspace/chat-session?fileId=${testFileId}`);
    
    if (!loadResponse.ok) {
      const errorText = await loadResponse.text();
      console.log('   ❌ 读取失败:', loadResponse.status, errorText);
      return;
    }

    const loadData = await loadResponse.json();
    console.log('   ✅ 读取成功');
    console.log('   📊 消息数量:', loadData.data.messageCount);
    console.log('   📊 消息内容:', loadData.data.messages.map((m: Record<string, unknown>) => `${(m as { role: string }).role}: ${(m as { content: string }).content.substring(0, 30)}...`));

  } catch (error) {
    console.log('   ❌ 测试异常:', error);
  }
}

async function testAISummaryAPI() {
  console.log('\n3️⃣  测试 AI Summary API...');
  
  const testFileId = `test-file-${Date.now()}`;
  const testSummary = `
# 文档摘要

这是一个测试文档的 AI 生成摘要。

## 主要内容
- 要点 1
- 要点 2
- 要点 3

## 结论
这是一个很好的文档。
  `.trim();

  try {
    // 保存 AI 摘要
    console.log('   📤 POST /api/workspace/ai-summary');
    const saveResponse = await fetch(`${BASE_URL}/api/workspace/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: testFileId,
        aiSummary: testSummary,
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.log('   ❌ 保存失败:', saveResponse.status, errorText);
      return;
    }

    const saveData = await saveResponse.json();
    console.log('   ✅ 保存成功');
    console.log('   📊 返回数据:', JSON.stringify(saveData, null, 2));

    // 读取 AI 摘要
    console.log('   📥 GET /api/workspace/ai-summary?fileId=' + testFileId);
    const loadResponse = await fetch(`${BASE_URL}/api/workspace/ai-summary?fileId=${testFileId}`);
    
    if (!loadResponse.ok) {
      const errorText = await loadResponse.text();
      console.log('   ❌ 读取失败:', loadResponse.status, errorText);
      return;
    }

    const loadData = await loadResponse.json();
    console.log('   ✅ 读取成功');
    console.log('   📊 摘要长度:', loadData.data.aiSummary?.length || 0, '字符');
    console.log('   📊 摘要预览:', loadData.data.aiSummary?.substring(0, 100) + '...');

  } catch (error) {
    console.log('   ❌ 测试异常:', error);
  }
}

async function main() {
  console.log('🧪 API 端点测试工具\n');
  console.log('📋 测试环境:', BASE_URL);
  console.log('');

  // 检查服务器是否运行
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      console.log('⚠️  警告: 服务器可能未运行');
      console.log('   请先运行: pnpm dev');
      console.log('');
    }
  } catch (error) {
    console.log('❌ 无法连接到服务器:', BASE_URL);
    console.log('   请先运行: pnpm dev');
    console.log('');
    return;
  }

  await testFlashcardsAPI();
  await testChatSessionAPI();
  await testAISummaryAPI();

  console.log('\n✅ 所有测试完成！\n');
  console.log('📝 说明：');
  console.log('   - 如果所有测试都通过，说明 API 工作正常');
  console.log('   - 如果测试失败，请检查：');
  console.log('     1. 开发服务器是否运行 (pnpm dev)');
  console.log('     2. Supabase 配置是否正确');
  console.log('     3. RLS 策略是否正确配置');
  console.log('');
}

main().catch(console.error);

