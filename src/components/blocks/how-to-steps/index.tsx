'use client';

import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepConfig {
  key: string;
  icon: LucideIcon;
}

interface HowToStepsProps {
  namespace: string;
  steps: StepConfig[];
  editorId?: string;
}

export default function HowToSteps({ namespace, steps, editorId }: HowToStepsProps) {
  const t = useTranslations(`${namespace}.how_to`);

  const scrollToEditor = () => {
    if (editorId) {
      const editor = document.getElementById(editorId);
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-muted/30" id="how-it-works">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                id={step.key.replace('step', 'step-')}
                className="relative p-6 rounded-2xl bg-card border border-border hover:shadow-xl transition-all duration-300"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/20" />
                )}

                <div className="pt-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {t(`${step.key}_title`)}
                  </h3>

                  <p className="text-muted-foreground">
                    {t(`${step.key}_desc`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={scrollToEditor}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {t('cta')}
          </Button>
        </div>
      </div>
    </section>
  );
}
