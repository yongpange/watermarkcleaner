'use client';

import React from 'react';
import ImageComparison from '@/components/image-comparison';

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
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/10 dark:to-indigo-950/10">
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
          <div className={reversed ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
            <ImageComparison
              beforeImage={{
                src: beforeImage,
                alt: 'Original image with watermark',
              }}
              afterImage={{
                src: afterImage,
                alt: 'Clean image without watermark',
              }}
            />
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Drag the handle or let it auto-play to see the transformation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
