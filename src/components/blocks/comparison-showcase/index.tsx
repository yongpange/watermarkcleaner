'use client';

import React from 'react';
import ComparisonSlider from '@/components/ui/comparison-slider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ComparisonShowcaseProps {
  title: string;
  subtitle: string;
  beforeImage: string;
  afterImage: string;
  reversed?: boolean;
}

export default function ComparisonShowcase({
  title,
  subtitle,
  beforeImage,
  afterImage,
  reversed = false,
}: ComparisonShowcaseProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('landing.comparison');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine background style based on theme
  const isDark = mounted && resolvedTheme === 'dark';
  
  return (
    <section 
      className="py-16 lg:py-24"
      style={{
        background: isDark 
          ? 'var(--background)' 
          : 'linear-gradient(to bottom right, rgb(245 243 255), rgb(238 242 255))'
      }}
    >
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Text Content */}
          <div className={reversed ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
            <div className="max-w-xl">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 lg:mb-8 leading-tight bg-gradient-to-r from-gray-900 to-violet-600 dark:from-white dark:to-violet-400 bg-clip-text text-transparent">
                {title}
              </h2>
              <p className="text-base text-muted-foreground mb-8 lg:mb-12">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Image Comparison Widget */}
          <div className={reversed ? "order-1 lg:order-1 flex justify-center w-full" : "order-1 lg:order-2 flex justify-center w-full"}>
            <ComparisonSlider
              beforeImage={beforeImage}
              afterImage={afterImage}
              beforeLabel={t('before_label')}
              afterLabel={t('after_label')}
              className="shadow-2xl w-full max-w-[360px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
