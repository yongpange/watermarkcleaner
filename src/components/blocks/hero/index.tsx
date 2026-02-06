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
import { loadImage, validateImageFile } from "@/lib/imageUtils";
import { toast } from "react-hot-toast";
import ComparisonSlider from '@/components/ui/comparison-slider';

export default function Hero({ hero }: { hero: HeroType }) {
  const router = useRouter();
  const setPendingImage = useUploadStore(state => state.setPendingImage);

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
                    beforeLabel="Watermarked"
                    afterLabel="Cleaned"
                    className="w-full max-w-xl aspect-[4/3] shadow-2xl rounded-2xl overflow-hidden border-4 border-white/20 dark:border-white/10"
                  />
              </div>

              {/* Right Column: Upload Area */}
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
                      // 跳转到 /convert 页面
                      router.push('/convert?fromUpload=true');
                    } catch (error) {
                      toast.error('Failed to load image. Please try again.');
                      console.error('Image loading error:', error);
                    }
                  }}
                  acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                  maxSize={20}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

    </>
  );
}
