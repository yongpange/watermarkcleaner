'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadArea } from "./upload-area-optimized";
import { Hero as HeroType } from "@/types/blocks/hero";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
import { SAMPLE_IMAGES } from "@/config/sampleImages";
import { loadImage, validateImageFile } from "@/lib/imageUtils";
import { toast } from "react-hot-toast";
import ComparisonSlider from '@/components/ui/comparison-slider';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { RiImageLine } from "react-icons/ri";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

export default function Hero({ hero }: { hero: HeroType }) {
  const router = useRouter();
  const setPendingImage = useUploadStore(state => state.setPendingImage);
  const setSampleId = useUploadStore(state => state.setSampleId);
  const t = useTranslations('landing');

  const handleSampleClick = (sampleId: string) => {
    setSampleId(sampleId);
    router.push('/convert?fromSample=true');
  };

  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts: string[] | null = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2) || null;
  }

  return (
    <section className="relative overflow-hidden bg-background text-foreground transition-colors duration-500">
      {/* Ambient background — theme-aware */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 dark:opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(circle, oklch(0.6 0.1 255 / 0.35), transparent 70%)',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-10 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.11 195 / 0.25), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.55 0.12 255 / 0.07) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.12 255 / 0.07) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Soft light-mode tint */}
        <div
          className="absolute inset-0 opacity-60 dark:opacity-0 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.65 0.08 255 / 0.06), transparent 70%)',
          }}
        />
      </div>

      <div className="container relative z-10 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <FadeIn direction="up" className="max-w-2xl">
            {hero.announcement && (
              <Link
                href={hero.announcement.url}
                className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-muted/50 mb-6"
              >
                {hero.announcement.label && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-xs">
                    {hero.announcement.label}
                  </Badge>
                )}
                <span className="text-muted-foreground">{hero.announcement.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
                {texts[0]}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
                {hero.title}
              </h1>
            )}

            <p
              className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />

            {hero.tip && (
              <p className="text-sm text-muted-foreground/70 mb-8">{hero.tip}</p>
            )}

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                size="lg"
                variant="glow"
                className="rounded-full px-8 h-12 text-base"
                onClick={() => {
                  const el = document.getElementById('upload-hero');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                {t('hero.cta_primary') || 'Remove Watermark Now'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base border-border/60 bg-background/50 hover:bg-muted/50"
                asChild
              >
                <Link href="/pricing">{t('hero.cta_secondary') || 'See Pricing'}</Link>
              </Button>
            </div>

            {/* Sample images */}
            <div className="mt-10">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                {t('sample_images.title')}
              </p>
              <div className="flex items-center gap-3">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSampleClick(sample.id)}
                    className="group relative w-16 h-16 rounded-xl overflow-hidden ring-1 ring-border/50 hover:ring-primary/50 transition-all duration-300 hover:scale-105"
                  >
                    <Image
                      src={sample.before}
                      alt={t('sample_images.alt')}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="64px"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                      <RiImageLine className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Right: Visual card */}
          <FadeIn direction="up" delay={0.15} className="relative">
            <div
              id="upload-hero"
              className="relative rounded-3xl border border-border/50 bg-card/60 dark:bg-card/40 backdrop-blur-xl p-6 lg:p-8 shadow-2xl"
            >
              <div className="absolute -inset-px rounded-3xl pointer-events-none" style={{
                background: 'linear-gradient(135deg, oklch(0.55 0.12 255 / 0.25), oklch(0.63 0.13 195 / 0.15), transparent 50%)',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: '1px',
              }} />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">AI EDITOR</span>
              </div>

              <ComparisonSlider
                beforeImage="/images/custom/demo_boy_watermarked.png"
                afterImage="/images/custom/demo_boy_clean.png"
                beforeLabel={t('comparison.before_label')}
                afterLabel={t('comparison.after_label')}
                className="w-full shadow-2xl rounded-2xl overflow-hidden border border-border/50"
              />

              <div className="mt-6">
                <UploadArea
                  onFileSelect={async (file) => {
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                      toast.error(validation.error!);
                      return;
                    }
                    try {
                      const image = await loadImage(file);
                      setPendingImage({ image, file });
                      router.push('/convert?fromUpload=true&autoProcess=true');
                    } catch (error) {
                      toast.error(t('hero.image_load_failed'));
                    }
                  }}
                  acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                  maxSize={20}
                />
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -bottom-4 -left-4 lg:-left-8 rounded-2xl border border-border/50 bg-card/70 dark:bg-card/50 backdrop-blur-xl p-4 shadow-xl hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('hero.ai_powered') || 'AI-Powered'}</p>
                  <p className="text-xs text-muted-foreground">{t('hero.precise_removal') || 'Precise watermark removal'}</p>
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
