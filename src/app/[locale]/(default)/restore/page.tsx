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

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/restore" : `/${locale}/restore`,
    },
  };
}

export default async function RestorePage() {
  return <RestoreClient />;
}
