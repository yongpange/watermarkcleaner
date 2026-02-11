import { getTranslations } from "next-intl/server";
import RestoreClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "restore.metadata" });

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const canonicalUrl = locale === "en" ? `${baseUrl}/restore` : `${baseUrl}/${locale}/restore`;

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
          url: "/images/og/restore-og.jpg",
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
      images: ["/images/og/restore-og.jpg"],
    },
  };
}

export default async function RestorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "restore" });

  // JSON-LD Schema Markup
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AI Photo Restoration Tool",
    "applicationCategory": "PhotoApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "10000",
    },
    "featureList": [
      "Scratch removal",
      "Tear repair",
      "Colorization",
      "Fading restoration",
      "Instant processing",
    ],
    "url": "https://watermarkcleaner.com/restore",
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": t("how_to.schema_name"),
    "description": t("how_to.schema_description"),
    "totalTime": "PT30S",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0",
    },
    "tool": {
      "@type": "HowToTool",
      "name": "AI Photo Restoration Tool",
    },
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": t("how_to.step1_title"),
        "text": t("how_to.step1_desc"),
        "url": "https://watermarkcleaner.com/restore#step1",
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": t("how_to.step2_title"),
        "text": t("how_to.step2_desc"),
        "url": "https://watermarkcleaner.com/restore#step2",
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": t("how_to.step3_title"),
        "text": t("how_to.step3_desc"),
        "url": "https://watermarkcleaner.com/restore#step3",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": t("faq.q1"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a1"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q2"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a2"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q3"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a3"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q4"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a4"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q5"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a5"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q6"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a6"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q7"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a7"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q8"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a8"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q9"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a9"),
        },
      },
      {
        "@type": "Question",
        "name": t("faq.q10"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("faq.a10"),
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            softwareApplicationSchema,
            howToSchema,
            faqSchema,
          ]),
        }}
      />
      <RestoreClient />
    </>
  );
}
