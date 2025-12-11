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
      <ComparisonShowcase
        title="Clean Up Photos with Magic Eraser — Free AI Object Remover"
        subtitle="Use Magic Eraser to remove any unwanted object, text, logo, or person from your photos. No experience needed — upload and let the AI tool handle the rest."
        beforeImage="/imgs/comparison-1-before.jpg"
        afterImage="/imgs/comparison-1-after.jpg"
      />
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
