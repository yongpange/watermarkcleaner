'use client';

import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

interface ProblemTypeConfig {
  key: string;
  icon: LucideIcon;
  color: string;
}

interface ProblemTypesProps {
  namespace: string;
  types: ProblemTypeConfig[];
}

export default function ProblemTypes({ namespace, types }: ProblemTypesProps) {
  const t = useTranslations(`${namespace}.problem_types`);

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {types.map((type) => {
            const Icon = type.icon;
            const examples = t(`types.${type.key}.examples`).split('|');
            return (
              <div
                key={type.key}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl ${type.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {t(`types.${type.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t(`types.${type.key}.desc`)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {examples.map((example, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                        >
                          {example.trim()}
                        </span>
                      ))}
                    </div>
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
