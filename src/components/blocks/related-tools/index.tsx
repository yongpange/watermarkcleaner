'use client';

import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ToolConfig {
  key: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

interface RelatedToolsProps {
  namespace: string;
  tools: ToolConfig[];
}

export default function RelatedTools({ namespace, tools }: RelatedToolsProps) {
  const t = useTranslations(`${namespace}.related_tools`);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.key}
                href={tool.href}
                className={`group p-6 rounded-2xl border border-border transition-all duration-300 ${tool.color}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-background/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {t(`tools.${tool.key}.name`)}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t(`tools.${tool.key}.desc`)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
