export const runtime = 'edge';

import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import Hero from "@/components/blocks/hero";
import WhyNeedSection from "@/components/blocks/why-need-section";
import HowToUse from "@/components/blocks/how-to-use";
import FormatSpecs from "@/components/blocks/format-specs";
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
          alt: t("landing.hero.og_alt"),
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

  // 从 JSON 获取 comparison 数据（国际化），如果没有则使用默认英文
  const comparisons = page.comparisons?.items || [];
  const compImages = [
    { before: "/images/custom/woman_city_watermarked.webp", after: "/images/custom/woman_city.webp" },
    { before: "/images/custom/woman_balcony_watermarked.webp", after: "/images/custom/woman_balcony.webp" },
    { before: "/images/custom/beach_watermarked.webp", after: "/images/custom/beach.webp" },
    { before: "/images/custom/stylish_woman_watermarked.webp", after: "/images/custom/stylish_woman.webp" },
  ];

  return (
    <>
      {/* 1. Hero Section with Comparison Slider + Upload */}
      {page.hero && <Hero hero={page.hero} />}

      {/* 2. Comparison Showcase Group 1 (2 items) */}
      {comparisons.length >= 2 && (
        <>
          <ComparisonShowcase
            title={comparisons[0]?.title || ""}
            subtitle={comparisons[0]?.description || ""}
            beforeImage={compImages[0].before}
            afterImage={compImages[0].after}
            reversed={false}
          />
          <ComparisonShowcase
            title={comparisons[1]?.title || ""}
            subtitle={comparisons[1]?.description || ""}
            beforeImage={compImages[1].before}
            afterImage={compImages[1].after}
            reversed={true}
          />
        </>
      )}

      {/* 3. Why Need AI Watermark Removal */}
      {page.why_need && <WhyNeedSection section={page.why_need} />}

      {/* 4. Feature Grid (9 features) */}
      {page.feature && <Feature section={page.feature} />}

      {/* 5. How To Use (4 steps) */}
      {page.usage && <HowToUse section={page.usage} />}

      {/* 6. Supported Formats & Specs */}
      {page.format_specs && <FormatSpecs section={page.format_specs} />}

      {/* 7. Stats */}
      {page.stats && <Stats section={page.stats} />}

      {/* 8. Testimonials */}
      {page.testimonial && <Testimonial section={page.testimonial} />}

      {/* 9. Comparison Showcase Group 2 (2 items) */}
      {comparisons.length >= 4 && (
        <>
          <ComparisonShowcase
            title={comparisons[2]?.title || ""}
            subtitle={comparisons[2]?.description || ""}
            beforeImage={compImages[2].before}
            afterImage={compImages[2].after}
            reversed={false}
          />
          <ComparisonShowcase
            title={comparisons[3]?.title || ""}
            subtitle={comparisons[3]?.description || ""}
            beforeImage={compImages[3].before}
            afterImage={compImages[3].after}
            reversed={true}
          />
        </>
      )}

      {/* 10. FAQ */}
      {page.faq && <FAQ section={page.faq} />}

      {/* 11. CTA */}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
