"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export default function TableOfContents({ content, className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [activeHeading, setActiveHeading] = useState<string>("");

  useEffect(() => {
    // Extract headings from content
    const headingElements: Array<{ id: string; text: string; level: number }> = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const match = line.match(/^#{1,3}\s+(.+)$/);
      if (match) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = match[1];
        const id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        headingElements.push({ id, text, level });
      }
    });

    setHeadings(headingElements);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const element = document.getElementById(heading.id);

        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeading(heading.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className={cn("toc sticky top-24 bg-background/80 backdrop-blur-sm rounded-lg border p-4 space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto", className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Table of Contents</h3>
      <div className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={cn(
              "block w-full text-left text-sm transition-colors hover:text-primary",
              "py-1 px-2 rounded hover:bg-primary/10",
              {
                "text-primary font-medium": activeHeading === heading.id,
                "text-muted-foreground": activeHeading !== heading.id,
                "ml-2": heading.level === 2,
                "ml-4": heading.level === 3,
              }
            )}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </nav>
  );
}

// Add CSS for smooth scrolling
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html {
      scroll-behavior: smooth;
    }

    .toc::-webkit-scrollbar {
      width: 4px;
    }

    .toc::-webkit-scrollbar-track {
      background: transparent;
    }

    .toc::-webkit-scrollbar-thumb {
      background: hsl(var(--primary) / 0.3);
      border-radius: 2px;
    }

    .toc::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--primary) / 0.5);
    }
  `;
  document.head.appendChild(style);
}