import { getTranslations } from "next-intl/server";
import RemoveBackgroundClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "remove-background.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/remove-background" : `/${locale}/remove-background`,
    },
  };
}

export default async function RemoveBackgroundPage() {
  return <RemoveBackgroundClient />;
}
