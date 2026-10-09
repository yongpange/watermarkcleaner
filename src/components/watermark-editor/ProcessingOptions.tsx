"use client";

import { useState } from "react";
import { RiSettings3Line } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export type ProcessingMode = "auto" | "conservative" | "aggressive";

export interface ProcessingOptions {
  mode: ProcessingMode;
  prompt?: string;
  enhanceQuality?: boolean;
  seed?: number;
}

interface ProcessingOptionsProps {
  value: ProcessingOptions;
  onChange?: (options: ProcessingOptions) => void;
  compact?: boolean;
  className?: string;
}

const modes: ProcessingMode[] = ["auto", "conservative", "aggressive"];

export default function ProcessingOptions({
  value,
  onChange,
  compact = false,
  className,
}: ProcessingOptionsProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("convert.processing");

  const getModeDescription = (mode: ProcessingMode): string => {
    switch (mode) {
      case "conservative":
        return t("conservative_mode_description");
      case "aggressive":
        return t("aggressive_mode_description");
      default:
        return t("auto_mode_description");
    }
  };

  return (
    <div className={cn("bg-card rounded-2xl border border-border", className)}>
      {compact ? (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                <RiSettings3Line className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("processing_mode")}</p>
                <p className="text-sm font-medium text-foreground">{t(value.mode)}</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              {expanded ? t("collapse") || "收起" : t("expand") || "展开"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3">{t("processing_mode")}</label>
            <div className="relative grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted">
              {modes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange?.({ ...value, mode })}
                  className={cn(
                    "relative z-10 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors text-center",
                    value.mode === mode ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {value.mode === mode && (
                    <motion.div
                      layoutId="processing-mode"
                      className="absolute inset-0 bg-primary rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{t(mode)}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">{getModeDescription(value.mode)}</p>
            </div>
          </div>

          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-muted text-xs transition-transform group-open:rotate-90">
                →
              </span>
              {t("advanced_options")}
            </summary>
            <div className="mt-3 space-y-2 pl-7">
              <textarea
                value={value.prompt || ""}
                onChange={(e) => onChange?.({ ...value, prompt: e.target.value })}
                placeholder={t("input_instructions")}
                className="w-full p-3 bg-background border border-input rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("ai_optimization")}</p>
            </div>
          </details>
        </div>
      )}

      {compact && expanded && (
        <div className="border-t border-border p-5">
          <ProcessingOptions
            value={value}
            onChange={onChange}
            compact={false}
          />
        </div>
      )}
    </div>
  );
}
