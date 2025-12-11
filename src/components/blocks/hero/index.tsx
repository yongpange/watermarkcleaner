'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { RiUploadCloud2Line, RiImageLine } from "react-icons/ri";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
import { loadImage, validateImageFile } from "@/lib/imageUtils";
import { toast } from "react-hot-toast";

export default function Hero({ hero }: { hero: HeroType }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPendingImage = useUploadStore(state => state.setPendingImage);

  if (hero.disabled) {
    return null;
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      // 跳转到 /convert 页面，添加标记
      router.push('/convert?fromUpload=true');
    } catch (error) {
      toast.error('Failed to load image. Please try again.');
      console.error('Image loading error:', error);
    } finally {
      // 清空 input 值，允许重复选择同一文件
      event.target.value = '';
    }
  };

  const highlightText = hero.highlight_text;
  let texts: string[] | null = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2) || null;
  }

  return (
    <>
      <HeroBg />
      <section className="py-12 lg:py-20">
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

            {/* Upload Area - Key Feature */}
            <div className="mx-auto max-w-2xl mb-8">
              <div
                onClick={handleUploadClick}
                className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-50/30 dark:to-violet-950/10 p-8 lg:p-12 transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                    <RiUploadCloud2Line className="w-8 h-8 lg:w-10 lg:h-10" />
                  </div>

                  <div className="text-center">
                    <p className="text-lg lg:text-xl font-semibold text-foreground mb-1">
                      Click or drag image here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, WebP, BMP (Max 20MB)
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 px-8 py-6 text-lg font-semibold"
                  >
                    <RiImageLine className="w-5 h-5 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {hero.tip && (
              <p className="text-sm text-muted-foreground mb-6">{hero.tip}</p>
            )}

            {hero.show_happy_users && <HappyUsers />}
          </div>
        </div>
      </section>
    </>
  );
}
