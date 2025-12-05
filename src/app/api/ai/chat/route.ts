import { NextRequest } from 'next/server';

/**
 * DeepSeek AI Chat API
 * 
 * 支持多轮对话的聊天接口
 * 支持流式响应（Server-Sent Events）
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, documentContent } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DeepSeek API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 构建系统提示词（包含文档上下文）
    const systemMessage = documentContent
      ? {
          role: 'system',
          content: `你是一个智能学习助手。用户正在学习以下文档内容：

${documentContent}

请基于这份文档内容回答用户的问题，帮助用户更好地理解和学习。如果用户的问题与文档无关，也可以进行一般性对话。`,
        }
      : {
          role: 'system',
          content: '你是一个智能学习助手，可以帮助用户理解文档内容、回答问题、提供学习建议。',
        };

    // 调用 DeepSeek API（流式）
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemMessage, ...messages],
        stream: true, // 启用流式响应
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'DeepSeek API request failed',
          details: errorData 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 创建流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body from DeepSeek API');
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // 解码数据块
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                // 跳过 [DONE] 标记
                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;

                  if (content) {
                    // 发送 SSE 格式的数据
                    const sseData = `data: ${JSON.stringify({ content })}\n\n`;
                    controller.enqueue(encoder.encode(sseData));
                  }
                } catch (e) {
                  // 忽略解析错误
                  console.error('Parse error:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      },
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI chat',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

