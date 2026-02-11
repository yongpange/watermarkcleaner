import { getTranslations } from "next-intl/server";
import UpscaleClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upscale.metadata" });
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const canonicalUrl = locale === "en" ? `${baseUrl}/upscale` : `${baseUrl}/${locale}/upscale`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: { canonical: canonicalUrl },
    openGraph: { title: t("og_title"), description: t("og_description"), url: canonicalUrl, siteName: "WatermarkCleaner", type: "website", locale: locale === "zh" ? "zh_CN" : locale === "es" ? "es_ES" : "en_US", images: [{ url: "/images/og/upscale-og.jpg", width: 1200, height: 630, alt: t("og_image_alt") }] },
    twitter: { card: "summary_large_image", title: t("og_title"), description: t("og_description"), images: ["/images/og/upscale-og.jpg"] },
  };
}

export default async function UpscalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upscale" });
  const schemas = {
    software: { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "AI Image Upscaler", applicationCategory: "PhotoApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "10000" }, featureList: ["4x upscaling", "Detail enhancement", "Noise reduction", "Quality preservation", "Instant processing"], url: "https://watermarkcleaner.com/upscale" },
    howTo: { "@context": "https://schema.org", "@type": "HowTo", name: t("how_to.schema_name"), description: t("how_to.schema_description"), totalTime: "PT30S", estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" }, tool: { "@type": "HowToTool", name: "AI Image Upscaler" }, step: [1, 2, 3].map((i) => ({ "@type": "HowToStep", position: i, name: t(`how_to.step${i}_title`), text: t(`how_to.step${i}_desc`), url: `https://watermarkcleaner.com/upscale#step${i}` })) },
    faq: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: Array.from({ length: 10 }, (_, i) => ({ "@type": "Question", name: t(`faq.q${i + 1}`), acceptedAnswer: { "@type": "Answer", text: t(`faq.a${i + 1}`) } })) },
  };

  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schemas.software, schemas.howTo, schemas.faq]) }} /><UpscaleClient /></>);
}
