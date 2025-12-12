import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import Testimonial from "@/components/blocks/testimonial";
import { getLandingPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import ComparisonShowcase from '@/components/blocks/comparison-showcase';

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

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
    openGraph: {
      title: t("metadata.title"),
      description: t("metadata.description"),
      url: canonicalUrl,
      siteName: "WatermarkCleaner",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.title"),
      description: t("metadata.description"),
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en": `${process.env.NEXT_PUBLIC_WEB_URL}`,
        "zh": `${process.env.NEXT_PUBLIC_WEB_URL}/zh`,
      },
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

      {/* Original - Text left, Image right */}
      <ComparisonShowcase
        title="Effortlessly Remove Watermarks with WatermarkCleaner — Your Free AI Solution"
        subtitle="Remove any unwanted watermarks, text, logos, or objects from your photos with WatermarkCleaner. No experience needed — just upload and let AI do the rest."
        beforeImage="/imgs/comparison-1-before.webp"
        afterImage="/imgs/comparison-1-after.webp"
        reversed={false}
      />

      {/* Copy #1 - Image left, Text right (reversed) */}
      <ComparisonShowcase
        title="Effortlessly Remove Watermarks with WatermarkCleaner — Your Free AI Solution"
        subtitle="Remove any unwanted watermarks, text, logos, or objects from your photos with WatermarkCleaner. No experience needed — just upload and let AI do the rest."
        beforeImage="/imgs/comparison-2-before.webp"
        afterImage="/imgs/comparison-2-after.webp"
        reversed={true}
      />

      {/* Copy #2 - Text left, Image right (normal) */}
      <ComparisonShowcase
        title="Effortlessly Remove Watermarks with WatermarkCleaner — Your Free AI Solution"
        subtitle="Remove any unwanted watermarks, text, logos, or objects from your photos with WatermarkCleaner. No experience needed — just upload and let AI do the rest."
        beforeImage="/imgs/comparison-3-before.webp"
        afterImage="/imgs/comparison-3-after.webp"
        reversed={false}
      />

      {/* Copy #3 - Image left, Text right (reversed) */}
      <ComparisonShowcase
        title="Effortlessly Remove Watermarks with WatermarkCleaner — Your Free AI Solution"
        subtitle="Remove any unwanted watermarks, text, logos, or objects from your photos with WatermarkCleaner. No experience needed — just upload and let AI do the rest."
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
