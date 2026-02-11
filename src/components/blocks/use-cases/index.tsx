'use client';

import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

interface UseCaseConfig {
  key: string;
  icon: LucideIcon;
  color: string;
}

interface UseCasesProps {
  namespace: string;
  cases: UseCaseConfig[];
}

export default function UseCases({ namespace, cases }: UseCasesProps) {
  const t = useTranslations(`${namespace}.use_cases`);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {cases.map((useCase) => {
            const Icon = useCase.icon;
            const examples = t(`cases.${useCase.key}.examples`).split('|');
            return (
              <div
                key={useCase.key}
                className="group p-6 rounded-2xl bg-card border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${useCase.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {t(`cases.${useCase.key}.title`)}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">
                      {t('pain_point_label')}: {t(`cases.${useCase.key}.pain_point`)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      {t('solution_label')}: {t(`cases.${useCase.key}.solution`)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {examples.map((example, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                      >
                        {example.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
