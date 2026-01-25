export const runtime = 'edge';

import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import Testimonial from "@/components/blocks/testimonial";
import { getLandingPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import ComparisonShowcase from '@/components/blocks/comparison-showcase';
import { locales } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  // 根据语言生成正确的语言代码
  const ogLocale = locale === "zh" ? "zh_CN" : locale === "en" ? "en_US" : `${locale}_${locale.toUpperCase()}`;

  // 生成所有语言版本的alternate映射
  const languages = Object.fromEntries(
    locales.map((loc) => [
      loc === "zh" ? "zh-CN" : loc,
      `${process.env.NEXT_PUBLIC_WEB_URL}${loc === "en" ? "" : `/${loc}`}`,
    ])
  );

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
    openGraph: {
      title: t("metadata.title"),
      description: t("metadata.description"),
      url: canonicalUrl,
      siteName: "WatermarkCleaner",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/imgs/comparison-1-after.webp",
          width: 1200,
          height: 675,
          alt: "WatermarkCleaner AI watermark removal demonstration",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.title"),
      description: t("metadata.description"),
      images: ["/imgs/comparison-1-after.webp"],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: languages,
    },
    other: {
      "application-name": "WatermarkCleaner",
      "apple-mobile-web-app-title": "WatermarkCleaner",
      "msapplication-TileColor": "#8b5cf6",
      "theme-color": "#8b5cf6",
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}

      {/* Feature 1 - AI-Powered Watermark Detection */}
      <ComparisonShowcase
        title="AI-Powered Watermark Detection – Automatic & Accurate"
        subtitle="Our advanced AI algorithms automatically detect and identify watermarks, logos, and text overlays in your images. No manual selection needed – WatermarkCleaner's intelligent system recognizes patterns and removes unwanted elements while preserving the original image quality."
        beforeImage="/imgs/comparison-1-before.webp"
        afterImage="/imgs/comparison-1-after.webp"
        reversed={false}
      />

      {/* Feature 2 - Batch Processing – Remove Multiple Watermarks at Once */}
      <ComparisonShowcase
        title="Batch Processing – Remove Multiple Watermarks at Once"
        subtitle="Save time with batch processing capabilities. Upload multiple images and remove watermarks from all of them simultaneously. Perfect for photographers, content creators, and businesses needing to clean large image collections efficiently."
        beforeImage="/imgs/comparison-2-before.webp"
        afterImage="/imgs/comparison-2-after.webp"
        reversed={true}
      />

      {/* Feature 3 - Preserve Image Quality – High-Resolution Output */}
      <ComparisonShowcase
        title="Preserve Image Quality – High-Resolution Output"
        subtitle="Worried about quality loss? WatermarkCleaner uses sophisticated inpainting technology that intelligently fills in removed areas based on surrounding pixels. Your images maintain crisp details, natural textures, and original resolution after watermark removal."
        beforeImage="/imgs/comparison-3-before.webp"
        afterImage="/imgs/comparison-3-after.webp"
        reversed={false}
      />

      {/* Feature 4 - Support All Image Formats – JPG, PNG, WEBP & More */}
      <ComparisonShowcase
        title="Support All Image Formats – JPG, PNG, WEBP & More"
        subtitle="WatermarkCleaner supports all popular image formats including JPG, JPEG, PNG, WEBP, BMP, and TIFF. Whether you're working with product photos, social media graphics, or professional photography, our tool handles it all with the same powerful watermark removal capabilities."
        beforeImage="/imgs/comparison-4-before.webp"
        afterImage="/imgs/comparison-4-after.webp"
        reversed={true}
      />

      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
