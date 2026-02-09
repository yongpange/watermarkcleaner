import { getTranslations } from "next-intl/server";
import ColorizeClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "colorize.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/colorize" : `/${locale}/colorize`,
    },
  };
}

export default async function ColorizePage() {
  return <ColorizeClient />;
}
