import Script from "next/script";

interface BlogJsonLdProps {
  type: "article" | "website";
  title: string;
  description: string;
  url: string;
  publishDate?: string;
  modifiedDate?: string;
  authorName?: string;
  imageUrl?: string;
}

export default function BlogJsonLd({
  type,
  title,
  description,
  url,
  publishDate,
  modifiedDate,
  authorName,
  imageUrl,
}: BlogJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type === "article" ? "BlogPosting" : "WebSite",
    headline: title,
    description,
    url,
    ...(type === "article" && {
      datePublished: publishDate,
      dateModified: modifiedDate || publishDate,
      author: {
        "@type": "Organization",
        name: authorName || "WatermarkCleaner Team",
        url: "https://watermarkcleaner.com",
      },
      publisher: {
        "@type": "Organization",
        name: "WatermarkCleaner",
        url: "https://watermarkcleaner.com",
        logo: {
          "@type": "ImageObject",
          url: "https://watermarkcleaner.com/logo.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
    }),
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
        width: 1200,
        height: 630,
      },
    }),
  };

  return (
    <Script
      id="blog-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2),
      }}
    />
  );
}

// Breadcrumb JSON-LD
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2),
      }}
    />
  );
}