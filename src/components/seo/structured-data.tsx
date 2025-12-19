"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface JsonLdProps {
  data: Record<string, any>;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationStructuredData() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'WatermarkCleaner',
        url: 'https://watermarkcleaner.com',
        logo: 'https://watermarkcleaner.com/favicon.png',
        description: 'AI-powered online watermark remover tool',
        areaServed: 'Worldwide',
        sameAs: [
          'https://twitter.com/watermarkcleaner',
          'https://www.facebook.com/watermarkcleaner',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@watermarkcleaner.com',
          contactType: 'Customer Service',
          availableLanguage: ['English', 'Chinese', 'Spanish', 'Arabic', 'Russian', 'French', 'Korean'],
        },
        offers: {
          '@type': 'Offer',
          name: 'Free Watermark Removal',
          url: 'https://watermarkcleaner.com',
          price: '0',
          priceCurrency: 'USD',
        },
      }}
    />
  );
}

export function WebPageStructuredData({
  title,
  description,
  locale = 'en',
}: {
  title: string;
  description: string;
  locale?: string;
}) {
  const pathname = usePathname();
  const url = `https://watermarkcleaner.com${pathname}`;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: description,
        url: url,
        inLanguage: locale === 'zh' ? 'zh-CN' : locale,
        publisher: {
          '@type': 'Organization',
          name: 'WatermarkCleaner',
          url: 'https://watermarkcleaner.com',
        },
        mainEntity: {
          '@type': 'WebApplication',
          name: 'WatermarkCleaner',
          applicationCategory: 'Photography',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList: [
            'AI-powered watermark removal',
            'Batch processing',
            'Support for multiple image formats',
            'High-resolution output',
            'No registration required',
          ],
        },
      }}
    />
  );
}

export function FAQStructuredData({
  faqs,
  locale = 'en',
}: {
  faqs: Array<{ question: string; answer: string }>;
  locale?: string;
}) {
  const pathname = usePathname();
  const url = `https://watermarkcleaner.com${pathname}`;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
        inLanguage: locale === 'zh' ? 'zh-CN' : locale,
        url: url,
      }}
    />
  );
}

export function ArticleStructuredData({
  title,
  description,
  author,
  publishDate,
  image,
  locale = 'en',
}: {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  image?: string;
  locale?: string;
}) {
  const pathname = usePathname();
  const url = `https://watermarkcleaner.com${pathname}`;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: description,
        author: {
          '@type': 'Person',
          name: author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'WatermarkCleaner',
          logo: {
            '@type': 'ImageObject',
            url: 'https://watermarkcleaner.com/favicon.png',
          },
        },
        datePublished: publishDate,
        url: url,
        image: image,
        inLanguage: locale === 'zh' ? 'zh-CN' : locale,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
      }}
    />
  );
}

export function SoftwareApplicationStructuredData({
  name,
  description,
  ratingValue,
  reviewCount,
  price,
  operatingSystem = 'Web Browser',
  locale = 'en',
}: {
  name: string;
  description: string;
  ratingValue: string;
  reviewCount: string;
  price?: string;
  operatingSystem?: string;
  locale?: string;
}) {
  const pathname = usePathname();
  const url = `https://watermarkcleaner.com${pathname}`;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: name,
        description: description,
        operatingSystem: operatingSystem,
        offers: {
          '@type': 'Offer',
          price: price || '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: ratingValue,
          reviewCount: reviewCount,
        },
        applicationCategory: 'Photography',
        featureList: [
          'AI watermark detection',
          'Automatic removal',
          'Batch processing',
          'Multiple format support',
          'High quality output',
        ],
      }}
    />
  );
}
