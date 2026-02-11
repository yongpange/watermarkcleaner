"use client";

import UpscaleEditor from "@/components/upscale-editor";
import ComparisonSlider from "@/components/ui/comparison-slider";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { AuthModal } from "@/components/auth/auth-modal";
import TrustBadges from "@/components/blocks/trust-badges";
import ProblemTypes from "@/components/blocks/problem-types";
import UseCases from "@/components/blocks/use-cases";
import HowToSteps from "@/components/blocks/how-to-steps";
import SocialProof from "@/components/blocks/social-proof";
import RelatedTools from "@/components/blocks/related-tools";
import { ImageIcon, Mountain, Sparkles, Grid3X3, Printer, ShoppingBag, Image, Frame, Upload, Download, Wind, History, Palette, Square } from "lucide-react";

const problemTypesConfig = [
  { key: 'low_res', icon: ImageIcon, color: 'bg-indigo-500/10 text-indigo-600' },
  { key: 'pixelated', icon: Grid3X3, color: 'bg-purple-500/10 text-purple-600' },
  { key: 'compressed', icon: Sparkles, color: 'bg-pink-500/10 text-pink-600' },
  { key: 'print', icon: Printer, color: 'bg-blue-500/10 text-blue-600' },
];

const useCasesConfig = [
  { key: 'print', icon: Printer, color: 'bg-amber-500/10 text-amber-600' },
  { key: 'ecommerce', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-600' },
  { key: 'wallpaper', icon: Frame, color: 'bg-indigo-500/10 text-indigo-600' },
  { key: 'old_photos', icon: History, color: 'bg-rose-500/10 text-rose-600' },
];

const howToStepsConfig = [
  { key: 'step1', icon: Upload },
  { key: 'step2', icon: Sparkles },
  { key: 'step3', icon: Download },
];

const relatedToolsConfig = [
  { key: 'denoise', icon: Wind, href: '/denoise', color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
  { key: 'restore', icon: History, href: '/restore', color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  { key: 'remove_bg', icon: Square, href: '/remove-background', color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20' },
  { key: 'colorize', icon: Palette, href: '/colorize', color: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20' },
];

export default function UpscaleClient() {
  const t = useTranslations("upscale");
  const { refreshCredits } = useAppContext();
  const [processingCount, setProcessingCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => { refreshCredits(); }, [refreshCredits]);
  const handleProcessingComplete = () => { refreshCredits(); setProcessingCount(prev => prev + 1); };
  const handleVerifyEmail = () => { setAuthModalOpen(true); };

  return (
    <div>
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 leading-tight py-1">{t("title")}</h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">{t("description")}</p>
          </div>
          <div id="upscale-editor" className="space-y-4">
            <div className="max-w-4xl mx-auto">
              <CreditsDisplay refreshKey={processingCount} onVerifyEmail={handleVerifyEmail} />
            </div>
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-1 md:p-6">
              <UpscaleEditor onProcessingComplete={handleProcessingComplete} />
            </div>
          </div>
        </div>
      </section>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Comparison Demos - 首屏视觉展示 */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="space-y-24 lg:space-y-32">
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="space-y-6 text-center lg:text-left order-1">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{t("features.f1_title")}</h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">{t("features.f1_desc")}</h3>
              </div>
            </div>
            <div className="order-2 w-full mx-auto">
              <ComparisonSlider beforeImage="/images/demo/upscale-portrait-before.webp" afterImage="/images/demo/upscale-portrait-after.webp" beforeLabel={t("features.f1_alt_before").split(":")[0]} afterLabel={t("features.f1_alt_after").split(":")[0]} beforeAlt={t("features.f1_alt_before")} afterAlt={t("features.f1_alt_after")} className="shadow-2xl aspect-square w-full max-w-[360px]" />
            </div>
          </article>
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="order-2 lg:order-1 w-full mx-auto">
              <ComparisonSlider beforeImage="/images/demo/upscale-landscape-before.webp" afterImage="/images/demo/upscale-landscape-after.webp" beforeLabel={t("features.f2_alt_before").split(":")[0]} afterLabel={t("features.f2_alt_after").split(":")[0]} beforeAlt={t("features.f2_alt_before")} afterAlt={t("features.f2_alt_after")} className="shadow-2xl aspect-square lg:ml-auto lg:mr-0 w-full max-w-[360px]" />
            </div>
            <div className="space-y-6 text-center lg:text-left order-1 lg:order-2">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t("features.f2_title")}</h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">{t("features.f2_desc")}</h3>
              </div>
            </div>
          </article>
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center container mx-auto px-4">
            <div className="space-y-6 text-center lg:text-left order-1">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{t("features.f3_title")}</h2>
                <h3 className="text-lg md:text-xl text-muted-foreground font-medium">{t("features.f3_desc")}</h3>
              </div>
            </div>
            <div className="order-2 w-full mx-auto">
              <ComparisonSlider beforeImage="/images/demo/upscale-detail-before.webp" afterImage="/images/demo/upscale-detail-after.webp" beforeLabel={t("features.f3_alt_before").split(":")[0]} afterLabel={t("features.f3_alt_after").split(":")[0]} beforeAlt={t("features.f3_alt_before")} afterAlt={t("features.f3_alt_after")} className="shadow-2xl aspect-square w-full max-w-[360px]" />
            </div>
          </article>
        </div>
      </section>

      <TrustBadges namespace="upscale" />
      <ProblemTypes namespace="upscale" types={problemTypesConfig} />
      <UseCases namespace="upscale" cases={useCasesConfig} />
      <HowToSteps namespace="upscale" steps={howToStepsConfig} editorId="upscale-editor" />
      <SocialProof namespace="upscale" />
      <RelatedTools namespace="upscale" tools={relatedToolsConfig} />
      <section aria-labelledby="faq-heading" className="container mx-auto px-4 max-w-3xl py-16 border-t border-border/50">
        <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold text-center mb-10">{t("faq.title")}</h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {Array.from({ length: 10 }).map((_, index) => {
            const i = index + 1;
            return (
              <AccordionItem key={i} value={`item-${i}`} className="bg-muted/30 px-6 rounded-xl border-none">
                <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-lg">
                  <span className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">Q</span>
                    {t(`faq.q${i}` as any)}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-9 pb-4 text-base leading-relaxed">{t(`faq.a${i}` as any)}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>
    </div>
  );
}
