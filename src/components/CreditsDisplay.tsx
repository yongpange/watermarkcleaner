"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CreditsInfo {
  tier: "unverified" | "verified" | "pro";
  used: number;
  limit: number;
  remaining: number;
}

interface CreditsDisplayProps {
  onVerifyEmail?: () => void;
  // Key prop to force re-fetch when it changes
  refreshKey?: number;
}

/**
 * Displays user's monthly credits in the UI
 * Shows current usage, tier information, and upgrade options
 * Supports both authenticated and unauthenticated (IP-based) users
 */
export function CreditsDisplay({ onVerifyEmail, refreshKey }: CreditsDisplayProps) {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("convert.credits");

  // Fetch credits info
  useEffect(() => {
    async function fetchCredits() {
      // Silent refresh: Only show loading spinner if we don't have data yet
      if (!credits) {
        setLoading(true);
      }
      setError(null);

      try {
        let response;
        if (status === "authenticated" && session?.user) {
          response = await fetch("/api/credits/check");
        } else if (status === "unauthenticated") {
          response = await fetch("/api/credits/check-ip");
        } else {
          return; // Loading or unknown state
        }

        if (response && response.ok) {
          const data = await response.json();
          // Update data silently
          setCredits(data);
        } else if (response) {
          console.error("Failed to fetch credits:", response.status);
          if (!credits) setError(`API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
        if (!credits) setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, refreshKey]); // Keep dependencies but ensure fetch logic handles silent updates

  // Minimalist Loading State (Skeleton)
  if (loading && !credits) {
    return (
      <div className="w-full px-4 py-3 space-y-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="h-1 bg-muted rounded-full w-full"></div>
      </div>
    );
  }

  if (!credits) return null;

  const isUnlimited = credits.limit === Infinity || credits.tier === 'pro';
  const percentage = isUnlimited ? 100 : Math.min((credits.used / credits.limit) * 100, 100);

  return (
    <div className="w-full px-4 py-3 border-t border-border/40 mt-auto bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin" : "hidden"}`} /> 
          {!loading && (
             credits.tier === 'pro' ? (
                <span className="text-primary flex items-center gap-1">
                   ✨ {t("pro_user")}
                </span>
             ) : (
                <span>{credits.used} / {credits.limit} {t("credits")}</span>
             )
          )}
        </div>
        
        {/* Upgrade Link for non-pro */}
        {credits.tier !== 'pro' && (
          <Link 
            href="/pricing"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t("upgrade_pro_button").replace("💎 ", "")} {/* Remove emoji for minimalist look */}
          </Link>
        )}
      </div>

      {/* Minimalist Progress Bar */}
      {!isUnlimited ? (
        <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
         <div className="text-xs text-muted-foreground mt-1">
            {t("unlimited")}
         </div>
      )}
      
      {/* Login Prompt for Guest */}
      {status === "unauthenticated" && onVerifyEmail && (
          <button
             onClick={onVerifyEmail}
             className="text-xs text-muted-foreground hover:text-primary mt-2 flex items-center gap-1 transition-colors"
          >
             {t("sign_in_to_continue")} &rarr;
          </button>
      )}
    </div>
  );
}
