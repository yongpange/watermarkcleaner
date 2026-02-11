'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, Shield, Zap, ImageIcon, UserCheck } from 'lucide-react';

const badges = [
  { key: 'free', icon: Sparkles },
  { key: 'watermark', icon: ImageIcon },
  { key: 'instant', icon: Zap },
  { key: 'privacy', icon: Shield },
  { key: 'signup', icon: UserCheck },
] as const;

interface TrustBadgesProps {
  namespace: string;
}

export default function TrustBadges({ namespace }: TrustBadgesProps) {
  const t = useTranslations(`${namespace}.trust_badges`);

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 mx-auto">
        <h2 className="text-center text-2xl font-semibold mb-8 text-foreground">
          {t('title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.key}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  {t(`${badge.key}.title`)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(`${badge.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
