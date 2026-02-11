import { getTranslations } from "next-intl/server";
import DenoiseClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "denoise.metadata" });

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const canonicalUrl = locale === "en" ? `${baseUrl}/denoise` : `${baseUrl}/${locale}/denoise`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: canonicalUrl,
      siteName: "WatermarkCleaner",
      type: "website",
      locale: locale === "zh" ? "zh_CN" : locale === "es" ? "es_ES" : "en_US",
      images: [
        {
          url: "/images/og/denoise-og.jpg",
          width: 1200,
          height: 630,
          alt: t("og_image_alt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["/images/og/denoise-og.jpg"],
    },
  };
}

export default async function DenoisePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "denoise" });

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AI Photo Denoise Tool",
    "applicationCategory": "PhotoApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "10000" },
    "featureList": ["Noise removal", "Grain reduction", "Detail preservation", "High-ISO fix", "Instant processing"],
    "url": "https://watermarkcleaner.com/denoise",
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": t("how_to.schema_name"),
    "description": t("how_to.schema_description"),
    "totalTime": "PT30S",
    "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
    "tool": { "@type": "HowToTool", "name": "AI Photo Denoise Tool" },
    "step": [
      { "@type": "HowToStep", "position": 1, "name": t("how_to.step1_title"), "text": t("how_to.step1_desc"), "url": "https://watermarkcleaner.com/denoise#step1" },
      { "@type": "HowToStep", "position": 2, "name": t("how_to.step2_title"), "text": t("how_to.step2_desc"), "url": "https://watermarkcleaner.com/denoise#step2" },
      { "@type": "HowToStep", "position": 3, "name": t("how_to.step3_title"), "text": t("how_to.step3_desc"), "url": "https://watermarkcleaner.com/denoise#step3" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": Array.from({ length: 10 }, (_, i) => ({
      "@type": "Question",
      "name": t(`faq.q${i + 1}`),
      "acceptedAnswer": { "@type": "Answer", "text": t(`faq.a${i + 1}`) },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([softwareApplicationSchema, howToSchema, faqSchema]) }} />
      <DenoiseClient />
    </>
  );
}
