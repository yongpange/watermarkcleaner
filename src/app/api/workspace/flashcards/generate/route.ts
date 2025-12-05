import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/workspace/flashcards/generate
 * 根据文档内容生成 12 个闪卡（问答卡片）
 */
export async function POST(request: NextRequest) {
  try {
    const { documentContent } = await request.json();

    if (!documentContent || typeof documentContent !== 'string') {
      return NextResponse.json(
        { error: '文档内容不能为空' },
        { status: 400 }
      );
    }

    // 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key 未配置' },
        { status: 500 }
      );
    }

    // 构建系统提示词
    const systemMessage = {
      role: 'system',
      content: `你是一个专业的学习卡片生成助手。请根据用户提供的文档内容，生成 12 个高质量的学习闪卡（Flashcards）。

要求：
1. 每个闪卡包含：问题（question）、答案（answer）、解释（explanation）
2. 问题应该简洁明了，能够测试对文档核心概念的理解
3. 答案应该准确且完整
4. 解释应该提供额外的背景信息或学习提示
5. 闪卡应该覆盖文档的不同主题和难度级别
6. 必须严格按照以下 JSON 格式返回，不要包含任何其他文本：

{
  "flashcards": [
    {
      "id": 1,
      "question": "问题内容",
      "answer": "答案内容",
      "explanation": "解释内容"
    }
  ]
}`,
    };

    const userMessage = {
      role: 'user',
      content: `请根据以下文档内容生成 12 个学习闪卡：

${documentContent}`,
    };

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }, // 要求返回 JSON 格式
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API error:', errorData);
      return NextResponse.json(
        { error: 'DeepSeek API 请求失败', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: '未能生成闪卡内容' },
        { status: 500 }
      );
    }

    // 解析 JSON 响应
    let flashcardsData;
    try {
      flashcardsData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse flashcards JSON:', e);
      return NextResponse.json(
        { error: '闪卡数据格式错误', details: content },
        { status: 500 }
      );
    }

    // 验证数据结构
    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      return NextResponse.json(
        { error: '闪卡数据结构无效' },
        { status: 500 }
      );
    }

    // 确保有 12 个闪卡
    const flashcards = flashcardsData.flashcards.slice(0, 12);
    if (flashcards.length < 12) {
      console.warn(`Only generated ${flashcards.length} flashcards, expected 12`);
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        flashcards,
        count: flashcards.length,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Generate flashcards error:', error);
    return NextResponse.json(
      { 
        error: '生成闪卡失败',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

