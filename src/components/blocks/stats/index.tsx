"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

function parseNumericValue(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  return {
    number: parseFloat(match[0]),
    prefix: value.slice(0, match.index),
    suffix: value.slice((match.index ?? 0) + match[0].length),
    decimals: match[0].includes(".") ? match[0].split(".")[1].length : 0,
  };
}

function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const parsed = parseNumericValue(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || !parsed || !ref.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const el = ref.current;
    const startTime = performance.now();
    const duration = 1500;

    let rafId: number;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * parsed.number;
      const formatted =
        parsed.decimals > 0
          ? current.toFixed(parsed.decimals)
          : Math.round(current).toString();
      el.textContent = `${parsed.prefix}${formatted}${parsed.suffix}`;

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, parsed]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

export default function Stats({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16 lg:py-24">
      <div className="container flex flex-col items-center gap-4">
        {section.label && (
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {section.icon && (
              <Icon name={section.icon} className="h-5 w-auto text-primary" />
            )}
            {section.label}
          </div>
        )}
        <h2 className="font-display text-center text-3xl font-semibold lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-center text-muted-foreground lg:text-lg">
          {section.description}
        </p>
        <div className="w-full grid gap-10 md:grid-cols-3 lg:gap-0 mt-12">
          {section.items?.map((item, index) => {
            return (
              <div
                key={index}
                className="text-center px-4"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.title}
                </p>
                <p className="font-display text-7xl font-semibold lg:text-8xl text-primary lg:pt-2">
                  <CountUp
                    value={item.label ?? "0"}
                    className="font-mono"
                  />
                </p>
                <p className="mt-3 text-base font-normal text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
