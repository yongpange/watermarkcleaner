'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import { UploadArea } from "./upload-area-optimized";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { RiUploadCloud2Line, RiImageLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
import { SAMPLE_IMAGES } from "@/config/sampleImages";
import { loadImage, validateImageFile } from "@/lib/imageUtils";
import { toast } from "react-hot-toast";
import ComparisonSlider from '@/components/ui/comparison-slider';
import { useTranslations } from 'next-intl';

export default function Hero({ hero }: { hero: HeroType }) {
  const router = useRouter();
  const setPendingImage = useUploadStore(state => state.setPendingImage);
  const setSampleId = useUploadStore(state => state.setSampleId);
  const t = useTranslations('landing');

  // 点击示例图片
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
    <>
      <HeroBg />
      <section className="pt-0 pb-12 lg:pt-4 lg:pb-20">
        <div className="container">
          <div className="text-center">
            {hero.announcement && (
              <Link
                href={hero.announcement.url}
                className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm transition-colors hover:bg-primary/10"
              >
                {hero.announcement.label && (
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
                    {hero.announcement.label}
                  </Badge>
                )}
                <span className="text-muted-foreground">{hero.announcement.title}</span>
              </Link>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-4 mt-4 max-w-4xl text-balance text-3xl font-bold lg:mb-6 lg:text-6xl">
                {texts[0]}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="mx-auto mb-4 mt-4 max-w-4xl text-balance text-3xl font-bold lg:mb-6 lg:text-6xl">
                {hero.title}
              </h1>
            )}

            <p
              className="mx-auto max-w-2xl text-muted-foreground text-base lg:text-lg mb-8"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />

            {hero.tip && (
              <p className="text-sm text-muted-foreground mb-6">{hero.tip}</p>
            )}

            {/* Split Layout: Comparison (Left) + Upload (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mt-8 lg:mt-12 max-w-7xl mx-auto text-left">
              
              {/* Left Column: Comparison Showcase */}
              <div className="w-full flex justify-center lg:justify-end">
                 <ComparisonSlider
                    beforeImage="/images/custom/demo_boy_watermarked.png"
                    afterImage="/images/custom/demo_boy_clean.png"
                    beforeLabel={t('comparison.before_label')}
                    afterLabel={t('comparison.after_label')}
                    className="w-full max-w-[360px] shadow-2xl rounded-2xl overflow-hidden border-4 border-white/20 dark:border-white/10"
                  />
              </div>

              {/* Right Column: Upload Area + Sample Images */}
              <div className="w-full max-w-xl mx-auto lg:mx-0">
                <UploadArea
                  onFileSelect={async (file) => {
                    // 验证文件
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                      toast.error(validation.error!);
                      return;
                    }

                    try {
                      // 加载图片
                      const image = await loadImage(file);
                      // 存储到 Zustand store
                      setPendingImage({ image, file });
                      // 跳转到 /convert 页面，自动开始处理
                      router.push('/convert?fromUpload=true&autoProcess=true');
                    } catch (error) {
                      toast.error(t('hero.image_load_failed'));
                      console.error('Image loading error:', error);
                    }
                  }}
                  acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                  maxSize={20}
                />

                {/* 示例图片 */}
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    {t('sample_images.title')}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {SAMPLE_IMAGES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSampleClick(sample.id)}
                        className="group relative w-[90px] h-[90px] rounded-xl overflow-hidden border-2 border-border/50 hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:scale-105 cursor-pointer"
                      >
                        <Image
                          src={sample.before}
                          alt={t('sample_images.alt')}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="90px"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center">
                          <RiImageLine className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </>
  );
}
