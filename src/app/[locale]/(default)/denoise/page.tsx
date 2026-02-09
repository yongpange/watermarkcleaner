import { getTranslations } from "next-intl/server";
import DenoiseClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "denoise.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/denoise" : `/${locale}/denoise`,
    },
  };
}

export default async function DenoisePage() {
  return <DenoiseClient />;
}
