'use client';

import { useTranslations } from 'next-intl';
import { Users, ImageIcon, Star, Award } from 'lucide-react';

const stats = [
  { key: 'users', icon: Users, value: '1M+' },
  { key: 'images', icon: ImageIcon, value: '10M+' },
  { key: 'rating', icon: Star, value: '4.9' },
  { key: 'satisfaction', icon: Award, value: '98%' },
] as const;

interface SocialProofProps {
  namespace: string;
}

export default function SocialProof({ namespace }: SocialProofProps) {
  const t = useTranslations(`${namespace}.social_proof`);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                className="p-6 rounded-2xl bg-card border border-border text-center hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t(`stats.${stat.key}`)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-foreground mb-4 italic">
                &ldquo;{t(`testimonials.${i}.quote`)}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {t(`testimonials.${i}.name`).charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {t(`testimonials.${i}.name`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`testimonials.${i}.role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
