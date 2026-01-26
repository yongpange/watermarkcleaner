import { getTranslations } from "next-intl/server";
import UnblurClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "unblur.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/unblur" : `/${locale}/unblur`,
    },
  };
}

export default async function UnblurPage() {
  return <UnblurClient />;
}
