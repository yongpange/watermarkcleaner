'use client';

import React from 'react';
import ImageComparison from '@/components/image-comparison';

interface ComparisonShowcaseProps {
  title: string;
  subtitle: string;
  beforeImage: string;
  afterImage: string;
}

export default function ComparisonShowcase({
  title,
  subtitle,
  beforeImage,
  afterImage,
}: ComparisonShowcaseProps) {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/10 dark:to-indigo-950/10">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <div className="max-w-xl">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 lg:mb-8 leading-tight bg-gradient-to-r from-gray-900 to-violet-600 dark:from-white dark:to-violet-400 bg-clip-text text-transparent">
                {title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 lg:mb-12">
                {subtitle}
              </p>

              {/* Feature Highlights */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-border/50">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M20 7h-9" />
                      <path d="M14 17H5" />
                      <circle cx="17" cy="17" r="3" />
                      <circle cx="7" cy="7" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Real-time Comparison
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Drag the slider to see the magic happen instantly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-border/50">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Automatic Demo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Auto-play animation shows the transformation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Comparison Widget */}
          <div className="order-1 lg:order-2">
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
