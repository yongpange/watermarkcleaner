export const runtime = 'edge';

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConvertPageClient } from "./convert-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  await getTranslations();

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const canonicalUrl = locale === "en" ? `${baseUrl}/convert` : `${baseUrl}/${locale}/convert`;

  const title = locale === "zh"
    ? "去水印编辑器 - 在线AI去水印工具 | WatermarkCleaner"
    : "Watermark Remover Editor - Online AI Watermark Removal | WatermarkCleaner";

  const description = locale === "zh"
    ? "使用我们的AI驱动编辑器轻松去除图片水印。上传图片，标记水印区域，一键去除。免费、快速、无需注册。"
    : "Remove watermarks from images easily with our AI-powered editor. Upload your image, mark the watermark area, and remove it with one click. Free, fast, and no sign-up required.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "WatermarkCleaner",
      type: "website",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ConvertPage() {
  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-medium text-primary mb-2 uppercase tracking-wider">AI Editor</p>
            <h1 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight">
              Remove Watermarks
              <span className="text-muted-foreground"> from Photos</span>
            </h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1.5 border border-border">
            {['Upload', 'Process', 'Download'].map((step, idx) => (
              <div
                key={step}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono">
                  {idx + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <ConvertPageClient />
      </div>
    </section>
  );
}
