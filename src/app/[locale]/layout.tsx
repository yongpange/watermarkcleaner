import "@/app/globals.css";

import { getMessages, getTranslations } from "next-intl/server";
import { locales } from "@/i18n/locale";

import { AppContextProvider } from "@/contexts/app";
import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { cn } from "@/lib/utils";
import { OrganizationStructuredData } from "@/components/seo/structured-data";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme";
import { Toaster } from "react-hot-toast";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: _locale } = await params;
  const t = await getTranslations();

  return {
    title: {
      template: `%s`,
      default: t("metadata.title") || "",
    },
    description: t("metadata.description") || "",
    keywords: t("metadata.keywords") || "",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "";
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}

        {isProduction && clarityProjectId && (
          <script type="text/javascript">
            {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityProjectId}");`}
          </script>
        )}

        <link rel="icon" href="/favicon.png" type="image/png" />

        {/* 组织结构化数据 */}
        {isProduction && <OrganizationStructuredData />}

        {locales &&
          locales.map((loc) => (
            <link
              key={loc}
              rel="alternate"
              hrefLang={loc}
              href={`${webUrl}${loc === "en" ? "" : `/${loc}`}/`}
            />
          ))}
        <link rel="alternate" hrefLang="x-default" href={webUrl} />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overflow-x-hidden"
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <AppContextProvider>
              <ThemeProvider attribute="class" disableTransitionOnChange>
                {children}
                <Toaster position="top-center" />
              </ThemeProvider>
            </AppContextProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
