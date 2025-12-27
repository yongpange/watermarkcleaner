'use client';

import { useMemo } from 'react';
import ImageComparison from '@/components/image-comparison';

interface MDXRendererProps {
  content: string;
}

export default function MDXRenderer({ content }: MDXRendererProps) {
  // 解析内容中的ImageComparison组件
  const parsedContent = useMemo(() => {
    // 查找所有ImageComparison组件
    const imageComparisonRegex = /<ImageComparison\s*beforeImage=\{\{[^}]+\}\}\s*afterImage=\{\{[^}]+\}\}\s*autoPlay=\{false\}\s*\/>/g;

    const parts = content.split(imageComparisonRegex);
    const matches = content.match(imageComparisonRegex);

    if (!matches) return [{ type: 'html', content }];

    const result: any[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim()) {
        result.push({ type: 'html', content: parts[i] });
      }

      if (matches[i]) {
        // 解析组件参数
        const srcRegex = /src:\s*"([^"]+)"/g;
        const altRegex = /alt:\s*"([^"]+)"/g;

        const srcMatches = [...matches[i].matchAll(srcRegex)];
        const altMatches = [...matches[i].matchAll(altRegex)];

        if (srcMatches.length >= 2 && altMatches.length >= 2) {
          result.push({
            type: 'imageComparison',
            beforeImage: {
              src: srcMatches[0][1],
              alt: altMatches[0][1]
            },
            afterImage: {
              src: srcMatches[1][1],
              alt: altMatches[1][1]
            }
          });
        }
      }
    }

    return result;
  }, [content]);

  return (
    <div className="markdown-content">
      {parsedContent.map((part, index) => {
        if (part.type === 'html') {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{
                __html: part.content
                  .replace(/^#\s+(.+)$/gm, '<h1 id="$1" class="text-4xl font-bold mb-6 text-primary">$1</h1>')
                  .replace(/^##\s+(.+)$/gm, '<h2 id="$1" class="text-2xl font-semibold mb-4 mt-8 text-primary/80">$1</h2>')
                  .replace(/^###\s+(.+)$/gm, '<h3 id="$1" class="text-xl font-semibold mb-3 mt-6 text-primary/70">$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em class="italic text-primary/80">$1</em>')
                  .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-foreground">')
                  .replace(/^(.+)$/gm, '<p class="mb-4 leading-relaxed text-foreground">$1</p>')
                  .replace(/<p class="mb-4 leading-relaxed text-foreground"><h1/g, '<h1')
                  .replace(/<\/h1><\/p>/g, '</h1>')
                  .replace(/<p class="mb-4 leading-relaxed text-foreground"><h2/g, '<h2')
                  .replace(/<\/h2><\/p>/g, '</h2>')
                  .replace(/<p class="mb-4 leading-relaxed text-foreground"><h3/g, '<h3')
                  .replace(/<\/h3><\/p>/g, '</h3>')
                  // Handle Markdown images: ![alt text](image-url)
                  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="w-full my-6"><img src="$2" alt="$1" class="blog-image w-full h-auto max-w-[1920px] mx-auto rounded-lg shadow-md" loading="lazy" /></div>')
                  // Handle code blocks
                  .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-6"><code class="text-sm">$1</code></pre>')
                  // Handle inline code
                  .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                  // Handle blockquotes
                  .replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>')
              }}
            />
          );
        } else if (part.type === 'imageComparison') {
          return (
            <ImageComparison
              key={index}
              beforeImage={part.beforeImage}
              afterImage={part.afterImage}
              autoPlay={false}
            />
          );
        }
        return null;
      })}
    </div>
  );
}