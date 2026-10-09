"use client";

import UnblurEditor from "@/components/unblur-editor";
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
import TrustBadges from "@/components/blocks/trust-badges";
import ProblemTypes from "@/components/blocks/problem-types";
import UseCases from "@/components/blocks/use-cases";
import HowToSteps from "@/components/blocks/how-to-steps";
import SocialProof from "@/components/blocks/social-proof";
import RelatedTools from "@/components/blocks/related-tools";
import { Move, Focus, Droplets, Type, User, ShoppingBag, FileText, Instagram, Upload, Sparkles, Download, Maximize2, Wind, History, Square } from "lucide-react";

// Problem Types Configuration
const problemTypesConfig = [
  { key: 'motion', icon: Move, color: 'bg-primary/10 text-primary' },
  { key: 'lens', icon: Focus, color: 'bg-primary/10 text-primary' },
  { key: 'soft', icon: Droplets, color: 'bg-orange-500/10 text-orange-600' },
  { key: 'text', icon: Type, color: 'bg-success/10 text-success' },
];

// Use Cases Configuration
const useCasesConfig = [
  { key: 'portrait', icon: User, color: 'bg-accent/10 text-accent' },
  { key: 'ecommerce', icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
  { key: 'documents', icon: FileText, color: 'bg-success/10 text-success' },
  { key: 'social', icon: Instagram, color: 'bg-primary/10 text-primary' },
];

// How To Steps Configuration
const howToStepsConfig = [
  { key: 'step1', icon: Upload },
  { key: 'step2', icon: Sparkles },
  { key: 'step3', icon: Download },
];

// Related Tools Configuration
const relatedToolsConfig = [
  { key: 'upscale', icon: Maximize2, href: '/upscale', color: 'bg-primary/10 text-primary hover:bg-blue-500/20' },
  { key: 'denoise', icon: Wind, href: '/denoise', color: 'bg-success/10 text-success hover:bg-green-500/20' },
  { key: 'restore', icon: History, href: '/restore', color: 'bg-warning/10 text-warning hover:bg-amber-500/20' },
  { key: 'remove_bg', icon: Square, href: '/remove-background', color: 'bg-primary/10 text-primary hover:bg-purple-500/20' },
];

export default function UnblurClient() {
  const t = useTranslations("unblur");
  const { refreshCredits } = useAppContext();
  const [processingCount, setProcessingCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Refresh credits when page loads
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const handleProcessingComplete = () => {
    refreshCredits();
    setProcessingCount((prev) => prev + 1);
  };

  const handleVerifyEmail = () => {
    setAuthModalOpen(true);
  };

  return (
    <div>
      {/* Header + Editor Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 leading-tight py-1">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>

          {/* Editor */}
          <div id="unblur-editor" className="space-y-4">
            <div className="max-w-4xl mx-auto">
              <CreditsDisplay
                refreshKey={processingCount}
                onVerifyEmail={handleVerifyEmail}
              />
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-1 md:p-6">
              <UnblurEditor onProcessingComplete={handleProcessingComplete} />
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Comparison Demos - 首屏视觉展示 */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="space-y-24 lg:space-y-32">
          {/* Demo 1: Portrait Unblur */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="space-y-6 text-center lg:text-left order-1">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold gradient-text">
                  {t("features.f1_title")}
                </h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t("features.f1_desc")}
                </h3>
              </div>
            </div>
            <div className="order-2 w-full mx-auto">
              <ComparisonSlider
                beforeImage="/images/demo/unblur-demo-before.webp"
                afterImage="/images/demo/unblur-demo-after.webp"
                beforeLabel={t("features.f1_alt_before").split(":")[0]}
                afterLabel={t("features.f1_alt_after").split(":")[0]}
                beforeAlt={t("features.f1_alt_before")}
                afterAlt={t("features.f1_alt_after")}
                className="shadow-2xl aspect-square w-full max-w-[360px]"
              />
            </div>
          </article>

          {/* Demo 2: Document Restoration */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="order-2 lg:order-1 w-full mx-auto">
              <ComparisonSlider
                beforeImage="/images/demo/unblur-doc-before-sq.webp"
                afterImage="/images/demo/unblur-doc-after-sq.webp"
                beforeLabel={t("features.f2_alt_before").split(":")[0]}
                afterLabel={t("features.f2_alt_after").split(":")[0]}
                beforeAlt={t("features.f2_alt_before")}
                afterAlt={t("features.f2_alt_after")}
                className="shadow-2xl aspect-square lg:ml-auto lg:mr-0 w-full max-w-[360px]"
              />
            </div>
            <div className="space-y-6 text-center lg:text-left order-1 lg:order-2">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold gradient-text">
                  {t("features.f2_title")}
                </h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t("features.f2_desc")}
                </h3>
              </div>
            </div>
          </article>

          {/* Demo 3: Landscape */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="space-y-6 text-center lg:text-left order-1">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  {t("features.f3_title")}
                </h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">
                  {t("features.f3_desc")}
                </h3>
              </div>
            </div>
            <div className="order-2 w-full mx-auto">
              <ComparisonSlider
                beforeImage="/images/demo/unblur-beach-before.webp"
                afterImage="/images/demo/unblur-beach-after.webp"
                beforeLabel={t("features.f3_alt_before").split(":")[0]}
                afterLabel={t("features.f3_alt_after").split(":")[0]}
                beforeAlt={t("features.f3_alt_before")}
                afterAlt={t("features.f3_alt_after")}
                className="shadow-2xl aspect-square w-full max-w-[360px]"
              />
            </div>
          </article>
        </div>
      </section>

      <TrustBadges namespace="unblur" />
      <ProblemTypes namespace="unblur" types={problemTypesConfig} />
      <UseCases namespace="unblur" cases={useCasesConfig} />
      <HowToSteps namespace="unblur" steps={howToStepsConfig} editorId="unblur-editor" />
      <SocialProof namespace="unblur" />
      <RelatedTools namespace="unblur" tools={relatedToolsConfig} />

      {/* FAQ Section */}
      <section
        aria-labelledby="faq-heading"
        className="container mx-auto px-4 max-w-3xl py-16 border-t border-border/50"
      >
        <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold text-center mb-10">
          {t("faq.title")}
        </h2>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {Array.from({ length: 10 }).map((_, index) => {
            const i = index + 1;
            return (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-muted/30 px-6 rounded-xl border-none"
              >
                <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-lg">
                  <span className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                      Q
                    </span>
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
  );
}
