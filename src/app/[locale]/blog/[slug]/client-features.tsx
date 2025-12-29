'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const scrollProgress = totalHeight > 0 ? (currentScroll / totalHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollProgress)));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="reading-progress" style={{ transform: `scaleX(${progress / 100})` }} />
  );
}

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top ${isVisible ? 'visible' : ''}`}
      aria-label="Back to top"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
}

export function SmoothScroll() {
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');

      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const targetElement = document.querySelector(href);

          if (targetElement) {
            const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY - 80;

            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });

            // 更新URL hash
            history.pushState(null, '', href);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return null;
}

export function CopyCodeButton() {
  useEffect(() => {
    const codeBlocks = document.querySelectorAll('.code-block-enhanced pre');

    codeBlocks.forEach((block) => {
      const button = document.createElement('button');
      button.className = 'copy-code-button';
      button.innerHTML = 'Copy';
      button.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;

      const wrapper = block.parentElement;
      if (wrapper) {
        wrapper.style.position = 'relative';
        wrapper.appendChild(button);

        wrapper.addEventListener('mouseenter', () => {
          button.style.opacity = '1';
        });

        wrapper.addEventListener('mouseleave', () => {
          button.style.opacity = '0';
        });

        button.addEventListener('click', () => {
          const code = block.textContent || '';
          navigator.clipboard.writeText(code).then(() => {
            button.innerHTML = 'Copied!';
            setTimeout(() => {
              button.innerHTML = 'Copy';
            }, 2000);
          });
        });
      }
    });
  }, []);

  return null;
}