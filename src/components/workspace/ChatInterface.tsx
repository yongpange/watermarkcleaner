"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, User, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string; // ✅ 新增：消息时间戳
}

interface ChatInterfaceProps {
  documentContent?: string;
  className?: string;
  fileId?: string; // ✅ 新增：用于保存到数据库
}

export default function ChatInterface({
  documentContent,
  className,
  fileId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionUuid, setSessionUuid] = useState<string | null>(null); // ✅ 新增：会话 UUID
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadChatHistory = useCallback(async () => {
    if (!fileId) return;

    try {
      const response = await fetch(`/api/workspace/chat-session?fileId=${fileId}`);
      if (!response.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = await response.json();
      if (data.success && data.data.hasSession) {
        setMessages(data.data.messages || []);
        setSessionUuid(data.data.sessionUuid);
        console.log("Chat history loaded:", data.data.messageCount, "messages");
      }
    } catch (error) {
      console.error("Load chat history error:", error);
      // 静默失败，不影响用户体验
    }
  }, [fileId]);

  // ✅ 从数据库加载聊天历史
  useEffect(() => {
    if (fileId) {
      loadChatHistory();
    }
  }, [fileId, loadChatHistory]);

  const saveChatHistory = useCallback(async () => {
    if (!fileId || messages.length === 0) return;

    try {
      const response = await fetch("/api/workspace/chat-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          messages,
          sessionUuid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save chat history");
      }

      const data = await response.json();
      if (data.success && data.data.sessionUuid && !sessionUuid) {
        setSessionUuid(data.data.sessionUuid);
      }
      console.log("Chat history saved");
    } catch (error) {
      console.error("Save chat history error:", error);
      // 静默失败，不影响用户体验
    }
  }, [fileId, messages, sessionUuid]);

  // ✅ 保存聊天历史到数据库（防抖）
  useEffect(() => {
    if (messages.length === 0 || !fileId) return;

    const timeoutId = setTimeout(() => {
      saveChatHistory();
    }, 2000); // 2 秒后保存

    return () => clearTimeout(timeoutId);
  }, [messages, fileId, saveChatHistory]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(), // ✅ 添加时间戳
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 调用聊天 API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';
      
      // 添加一个空的助手消息，用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const json = JSON.parse(data);
              if (json.content) {
                assistantMessage += json.content;
                
                // 更新最后一条消息（助手消息）
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date().toISOString(), // ✅ 添加时间戳
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toast.error(errorMessage);
      
      // 移除空的助手消息
      setMessages(prev => prev.filter(msg => msg.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <Bot className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">AI 助手</h3>
        <Sparkles className="w-4 h-4 text-yellow-500 ml-auto" />
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">开始对话</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                我可以帮你理解文档内容、回答问题、提供学习建议
              </p>
              {documentContent && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 我已经了解了你的文档内容
                </p>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 items-start",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          按 Enter 发送，Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}

