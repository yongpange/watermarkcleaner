'use client';

import React from 'react';
import ComparisonSlider from '@/components/ui/comparison-slider';
import { useTranslations } from 'next-intl';
import { FadeIn } from '@/components/motion/FadeIn';
import { cn } from '@/lib/utils';

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
  const t = useTranslations('landing.comparison');

  return (
    <section className="py-16 lg:py-24 border-b border-border last:border-b-0">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <FadeIn
            direction="up"
            className={cn(
              "lg:col-span-5",
              reversed ? "order-2 lg:order-2 lg:col-start-8" : "order-2 lg:order-1"
            )}
          >
            <div className="max-w-lg">
              <h2 className="font-display text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight mb-5 leading-[1.1]">
                {title}
              </h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            </div>
          </FadeIn>

          <FadeIn
            direction="up"
            delay={0.1}
            className={cn(
              "lg:col-span-7",
              reversed ? "order-1 lg:order-1 lg:col-start-1" : "order-1 lg:order-2"
            )}
          >
            <div className="flex justify-center w-full">
              <ComparisonSlider
                beforeImage={beforeImage}
                afterImage={afterImage}
                beforeLabel={t('before_label')}
                afterLabel={t('after_label')}
                className="w-full max-w-[420px] lg:max-w-none lg:w-full"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
