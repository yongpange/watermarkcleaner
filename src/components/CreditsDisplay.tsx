"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CreditsInfo {
  tier: "unverified" | "verified" | "pro";
  used: number;
  limit?: number;
  maxCredits?: number;
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
        const fetchOptions = { cache: 'no-store' as RequestCache };
        
        if (status === "authenticated" && session?.user) {
          response = await fetch("/api/credits/check", fetchOptions);
        } else if (status === "unauthenticated") {
          response = await fetch("/api/credits/check-ip", fetchOptions);
        } else {
          return; // Loading or unknown state
        }

        if (response && response.ok) {
          const data = await response.json();
          // Update data silently
          setCredits(data);
        } else if (response) {
          console.error("Failed to fetch credits:", response.status);
          // If we have previous credits, don't clear them, just log
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
    
    // Listen for global credit update events
    const handleCreditUpdate = () => {
      fetchCredits();
    };
    window.addEventListener('credit-update', handleCreditUpdate);

    return () => {
      window.removeEventListener('credit-update', handleCreditUpdate);
    };
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

  // Error State
  if (error && !credits) {
    return (
      <div className="w-full px-4 py-3 border-t border-border/40 mt-auto bg-destructive/5">
        <div className="text-xs text-destructive flex items-center gap-1">
          <span>⚠️ Failed to load credits: {error}</span>
          <button 
             onClick={() => window.location.reload()} 
             className="underline hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!credits) return null;

  const isUnlimited = credits.limit === Infinity || credits.tier === 'pro';
  const displayLimit = credits.maxCredits || credits.limit || 0;
  // Calculate percentage: if remaining > limit, show full bar or based on some scale? 
  // For pay-as-you-go, just show 100% if they have credits.
  const percentage = isUnlimited ? 100 : (credits.remaining > 0 ? 100 : 0);

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
                <span>{credits.remaining} {t("credits")}</span>
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
            style={{ width: `${Math.min(100, (credits.remaining / (displayLimit || 10)) * 100)}%` }}
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
