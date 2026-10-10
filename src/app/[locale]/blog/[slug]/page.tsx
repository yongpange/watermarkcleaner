// Blog posts use Edge Runtime with pre-compiled data
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import BlogJsonLd, { BreadcrumbJsonLd } from "@/components/blocks/blog/blog-jsonld";
import MDXRenderer from "@/components/markdown/mdx-renderer";
import { getPostBySlug, type Locale } from "@/lib/blog";
import { ReadingProgress } from "./client-features";
import "./essay.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;

  const post = await getPostBySlug(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const postUrl = `${siteUrl}/${locale}/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags.join(", "),
    authors: [{ name: post.authorName }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: locale,
      publishedTime: post.publishDate,
      authors: [post.authorName],
      url: postUrl,
      siteName: "WatermarkCleaner",
      ...(post.coverImage && {
        images: [
          {
            url: `${siteUrl}${post.coverImage}`,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      creator: "@watermarkcleaner",
      ...(post.coverImage && {
        images: [`${siteUrl}${post.coverImage}`],
      }),
    },
    alternates: {
      canonical: postUrl,
      languages: {
        en: `${siteUrl}/en/blog/${slug}`,
        zh: `${siteUrl}/zh/blog/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("blog");

  const post = await getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const published = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.publishDate));

  const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";

  return (
    <>
      <BlogJsonLd
        type="article"
        title={post.title}
        description={post.description}
        url={`${siteUrl}/${locale}/blog/${slug}`}
        publishDate={post.publishDate}
        authorName={post.authorName}
        imageUrl={post.coverImage}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${siteUrl}/${locale}` },
          { name: "Blog", url: `${siteUrl}/${locale}/blog` },
          { name: post.title, url: `${siteUrl}/${locale}/blog/${slug}` },
        ]}
      />

      <ReadingProgress />

      <article className="essay">
        <div className="essay-frame">
          <Link href="/blog" className="essay-back">
            {t("back_to_blog")}
          </Link>
          <p className="essay-kicker">{post.categoryName}</p>
          <h1>{post.title}</h1>
          <p className="essay-dek">{post.description}</p>
          <div className="essay-meta">
            <time dateTime={post.publishDate}>{published}</time>
            <span aria-hidden="true">·</span>
            <span>{t("min_read", { minutes: post.readTime })}</span>
            <span aria-hidden="true">·</span>
            <span>{post.authorName}</span>
          </div>
          <div className="essay-rule" />
          <div className="essay-body">
            <MDXRenderer content={post.content} />
          </div>
        </div>
      </article>
    </>
  );
}
