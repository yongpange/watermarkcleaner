import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { getLandingPage } from "@/services/page";
import { ReactNode } from "react";

export default async function BlogLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      {page.header && <Header header={page.header} />}
      <main className="overflow-x-hidden pt-16">{children}</main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}
