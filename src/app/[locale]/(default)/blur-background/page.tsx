import { getTranslations } from "next-intl/server";
import BlurBackgroundClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blur-background.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/blur-background" : `/${locale}/blur-background`,
    },
  };
}

export default async function BlurBackgroundPage() {
  return <BlurBackgroundClient />;
}
