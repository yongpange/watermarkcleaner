'use client';

import { useMemo } from 'react';
import ImageComparison from '@/components/image-comparison';
import CTAButton from '@/components/blog/CTAButton';

interface MDXRendererProps {
  content: string;
}

export default function MDXRenderer({ content }: MDXRendererProps) {
  // 解析内容中的自定义组件
  const parsedContent = useMemo(() => {
    // 查找所有ImageComparison组件
    const imageComparisonRegex = /<ImageComparison\s*beforeImage=\{\{[^}]+\}\}\s*afterImage=\{\{[^}]+\}\}\s*autoPlay=\{false\}\s*\/>/g;
    // 查找CTAButton组件
    const ctaButtonRegex = /<CTAButton[^>]*>.*?<\/CTAButton>/g;

    const result: any[] = [];
    let lastIndex = 0;
    let match;

    // 创建一个匹配所有组件的正则
    const combinedRegex = /<ImageComparison\s*beforeImage=\{\{[^}]+\}\}\s*afterImage=\{\{[^}]+\}\}\s*autoPlay=\{false\}\s*\/>|<CTAButton[^>]*>.*?<\/CTAButton>/g;

    while ((match = combinedRegex.exec(content)) !== null) {
      // 添加匹配前的HTML内容
      if (match.index > lastIndex) {
        const htmlContent = content.substring(lastIndex, match.index);
        if (htmlContent.trim()) {
          result.push({ type: 'html', content: htmlContent });
        }
      }

      // 处理匹配的组件
      if (match[0].startsWith('<ImageComparison')) {
        // 解析ImageComparison组件参数
        const srcRegex = /src:\s*"([^"]+)"/g;
        const altRegex = /alt:\s*"([^"]+)"/g;

        const srcMatches = [...match[0].matchAll(srcRegex)];
        const altMatches = [...match[0].matchAll(altRegex)];

        if (srcMatches.length >= 2) {
          result.push({
            type: 'imageComparison',
            beforeImage: {
              src: srcMatches[0]?.[1] || '',
              alt: altMatches[0]?.[1] || 'Before'
            },
            afterImage: {
              src: srcMatches[1]?.[1] || '',
              alt: altMatches[1]?.[1] || 'After'
            }
          });
        }
      } else if (match[0].startsWith('<CTAButton')) {
        // 解析CTAButton内容
        const buttonContent = match[0].replace(/<\/?CTAButton[^>]*>/g, '').trim();
        result.push({
          type: 'ctaButton',
          content: buttonContent
        });
      }

      lastIndex = combinedRegex.lastIndex;
    }

    // 添加剩余HTML内容
    if (lastIndex < content.length) {
      const htmlContent = content.substring(lastIndex);
      if (htmlContent.trim()) {
        result.push({ type: 'html', content: htmlContent });
      }
    }

    return result;
  }, [content]);

  return (
    <div className="markdown-content space-y-6 animate-fade-in-up animation-delay-400">
      {parsedContent.map((part, index) => {
        if (part.type === 'html') {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{
                __html: part.content
                  // 增强的标题样式
                  .replace(/^#\s+(.+)$/gm, '<h1 id="$1" class="text-4xl md:text-5xl font-bold mb-8 text-primary scroll-mt-20 relative group">$1<span class="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-primary/50 cursor-pointer">#</span></h1>')
                  .replace(/^##\s+(.+)$/gm, '<h2 id="$1" class="text-2xl md:text-3xl font-semibold mb-6 mt-12 text-primary/90 scroll-mt-20 relative group border-b border-border/30 pb-2">$1<span class="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-primary/50 cursor-pointer">#</span></h2>')
                  .replace(/^###\s+(.+)$/gm, '<h3 id="$1" class="text-xl md:text-2xl font-semibold mb-4 mt-8 text-primary/80 scroll-mt-20 relative group">$1<span class="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-primary/50 cursor-pointer">#</span></h3>')
                  // 增强的文本样式
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-primary bg-primary/10 px-1 rounded">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em class="italic text-primary/80">$1</em>')
                  // 增强的段落样式
                  .replace(/\n\n/g, '</p><p class="mb-6 leading-relaxed text-foreground text-lg md:text-xl">')
                  .replace(/^(.+)$/gm, '<p class="mb-6 leading-relaxed text-foreground text-lg md:text-xl">$1</p>')
                  .replace(/<p class="mb-6 leading-relaxed text-foreground text-lg md:text-xl"><h1/g, '<h1')
                  .replace(/<\/h1><\/p>/g, '</h1>')
                  .replace(/<p class="mb-6 leading-relaxed text-foreground text-lg md:text-xl"><h2/g, '<h2')
                  .replace(/<\/h2><\/p>/g, '</h2>')
                  .replace(/<p class="mb-6 leading-relaxed text-foreground text-lg md:text-xl"><h3/g, '<h3')
                  .replace(/<\/h3><\/p>/g, '</h3>')
                  // 增强的图片样式
                  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="w-full my-8 flex justify-center"><div class="relative group max-w-4xl"><img src="$2" alt="$1" class="blog-image w-full h-auto rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" loading="lazy" /><div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div></div></div>')
                  // 增强的代码块样式
                  .replace(/```([\s\S]*?)```/g, '<div class="code-block-enhanced my-8"><pre class="p-6 rounded-lg overflow-x-auto"><code class="text-sm leading-relaxed">$1</code></pre></div>')
                  // 增强的内联代码样式
                  .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border/50">$1</code>')
                  // 增强的引用块样式
                  .replace(/^>\s+(.+)$/gm, '<blockquote class="blockquote-enhanced my-8"><p class="!mb-0">$1</p></blockquote>')
                  // 增强的列表样式
                  .replace(/^\*\s+(.+)$/gm, '<li class="mb-2 ml-4 relative before:content-["•"] before:absolute before:-left-4 before:text-primary">$1</li>')
                  .replace(/^\d+\.\s+(.+)$/gm, '<li class="mb-2 ml-4">$1</li>')
                  // 添加链接样式
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:text-primary/80 underline underline-offset-4 decoration-2 hover:decoration-primary/50 transition-all duration-200">$1</a>')
              }}
            />
          );
        } else if (part.type === 'imageComparison') {
          return (
            <div key={index} className="w-full my-8 flex justify-center">
              <div className="w-full max-w-none md:max-w-3xl lg:max-w-4xl">
                <ImageComparison
                  beforeImage={part.beforeImage}
                  afterImage={part.afterImage}
                  autoPlay={false}
                />
              </div>
            </div>
          );
        } else if (part.type === 'ctaButton') {
          return <CTAButton key={index}>{part.content}</CTAButton>;
        }
        return null;
      })}
    </div>
  );
}