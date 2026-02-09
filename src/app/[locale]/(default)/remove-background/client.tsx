"use client";

import BackgroundRemoverEditor from "@/components/background-remover-editor";
import ComparisonSlider from "@/components/ui/comparison-slider";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { AuthModal } from "@/components/auth/auth-modal";
import { useState } from "react";

export default function RemoveBackgroundClient() {
  const t = useTranslations("remove-background");
  const { refreshCredits } = useAppContext();
  const [processingCount, setProcessingCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Refresh credits when page loads
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const handleProcessingComplete = () => {
    refreshCredits();
    setProcessingCount(prev => prev + 1);
  };

  const handleVerifyEmail = () => {
    setAuthModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <section className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600 leading-tight py-1">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            {t("description")}
          </p>
        </section>

        {/* Editor Section */}
        <div className="space-y-4">
             {/* Credits Display */}
             <div className="max-w-4xl mx-auto">
                <CreditsDisplay
                  refreshKey={processingCount}
                  onVerifyEmail={handleVerifyEmail}
                />
              </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-1 md:p-6">
              <BackgroundRemoverEditor onProcessingComplete={handleProcessingComplete} />
            </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Feature Demos Section */}
        <section className="space-y-24 lg:space-y-32 py-8 lg:py-12 mt-16 md:mt-24">

          {/* Demo 1: Portrait Background Removal */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="space-y-6 text-center lg:text-left order-1">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {t("features.f1_title")}
                </h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t("features.f1_desc")}
                </h3>
              </div>
            </div>
            <div className="order-2 w-full mx-auto">
               <ComparisonSlider
                 beforeImage={t("features.f1_image_before")}
                 afterImage={t("features.f1_image_after")}
                 beforeLabel={t("features.f1_alt_before").split(":")[0]}
                 afterLabel={t("features.f1_alt_after").split(":")[0]}
                 beforeAlt={t("features.f1_alt_before")}
                 afterAlt={t("features.f1_alt_after")}
                 className="shadow-2xl aspect-square w-full max-w-2xl"
               />
            </div>
          </article>

          {/* Demo 2: Product Background Removal */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
             <div className="order-2 lg:order-1 w-full mx-auto">
               <ComparisonSlider
                 beforeImage={t("features.f2_image_before")}
                 afterImage={t("features.f2_image_after")}
                 beforeLabel={t("features.f2_alt_before").split(":")[0]}
                 afterLabel={t("features.f2_alt_after").split(":")[0]}
                 beforeAlt={t("features.f2_alt_before")}
                 afterAlt={t("features.f2_alt_after")}
                 className="shadow-2xl aspect-square lg:ml-auto lg:mr-0 w-full max-w-2xl"
               />
            </div>
            <div className="space-y-6 text-center lg:text-left order-1 lg:order-2">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t("features.f2_title")}
                </h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t("features.f2_desc")}
                </h3>
              </div>
            </div>
          </article>

          {/* Demo 3: Complex Background Removal */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="space-y-6 text-center lg:text-left order-1">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {t("features.f3_title")}
                </h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t("features.f3_desc")}
                </h3>
              </div>
            </div>
            <div className="order-2 w-full mx-auto">
               <ComparisonSlider
                 beforeImage={t("features.f3_image_before")}
                 afterImage={t("features.f3_image_after")}
                 beforeLabel={t("features.f3_alt_before").split(":")[0]}
                 afterLabel={t("features.f3_alt_after").split(":")[0]}
                 beforeAlt={t("features.f3_alt_before")}
                 afterAlt={t("features.f3_alt_after")}
                 className="shadow-2xl aspect-square w-full max-w-2xl"
               />
            </div>
          </article>

        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto py-12 border-t border-border/50">
          <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold text-center mb-10">{t("faq.title")}</h2>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {Array.from({ length: 8 }).map((_, index) => {
              const i = index + 1;
              return (
                <AccordionItem key={i} value={`item-${i}`} className="bg-muted/30 px-6 rounded-xl border-none">
                  <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-lg">
                    <span className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">Q</span>
                      {t(`faq.q${i}` as any)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-9 pb-4 text-base leading-relaxed">
                    {t(`faq.a${i}` as any)}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>

      </div>
    </div>
  );
}
