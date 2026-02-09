import { getTranslations } from "next-intl/server";
import UpscaleClient from "./client";

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upscale.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "en" ? "/upscale" : `/${locale}/upscale`,
    },
  };
}

export default async function UpscalePage() {
  return <UpscaleClient />;
}
