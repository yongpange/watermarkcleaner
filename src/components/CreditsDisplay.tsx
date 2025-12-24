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

/**
 * Displays user's monthly credits in the UI
 * Shows current usage, tier information, and upgrade options
 * Supports both authenticated and unauthenticated (IP-based) users
 */
export function CreditsDisplay() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("convert.credits");

  // Fetch credits info for both authenticated and unauthenticated users
  useEffect(() => {
    async function fetchCredits() {
      setLoading(true);
      try {
        if (status === "authenticated" && session?.user) {
          // For authenticated users, use user ID
          const response = await fetch("/api/credits/check");
          if (response.ok) {
            const data = await response.json();
            setCredits(data);
          }
        } else if (status === "unauthenticated") {
          // For unauthenticated users, use IP address
          const response = await fetch("/api/credits/check-ip");
          if (response.ok) {
            const data = await response.json();
            setCredits(data);
          } else {
            // Fallback to default if API fails
            setCredits({
              tier: "unverified",
              used: 0,
              limit: 3,
              remaining: 3
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
        // Fallback for unauthenticated users
        if (status === "unauthenticated") {
          setCredits({
            tier: "unverified",
            used: 0,
            limit: 3,
            remaining: 3
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, [session, status]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">{t("loading")}</span>
      </div>
    );
  }

  // Don't show if credits haven't loaded yet
  if (!credits) {
    return null;
  }

  // For unauthenticated users, show simplified version
  if (status === "unauthenticated") {
    return (
      <div className="w-full p-3 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg border border-violet-200 dark:border-violet-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
              {t("free_trial")}
            </span>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${(credits.used / credits.limit) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t("monthly_usage", { used: credits.used, limit: credits.limit })}
          </span>
          <span className="font-medium text-violet-900 dark:text-violet-100">
            {t("remaining", { remaining: credits.remaining })}
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-violet-200 dark:border-violet-800">
          <Link
            href="/auth/verify"
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline block"
          >
            {t("verify_email")}
          </Link>
        </div>
      </div>
    );
  }

  const tierNames = {
    unverified: t("free_trial"),
    verified: "已验证用户",
    pro: "专业版",
  };

  const isUnlimited = credits.limit === Infinity;

  return (
    <div className="w-full p-3 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg border border-violet-200 dark:border-violet-800">
      {/* Tier Display */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
          <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
            {tierNames[credits.tier]}
          </span>
        </div>
      </div>

      {/* Credits Usage Bar */}
      {!isUnlimited && (
        <>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${(credits.used / credits.limit) * 100}%` }}
            />
          </div>

          {/* Usage Stats */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {t("monthly_usage", { used: credits.used, limit: credits.limit })}
            </span>
            <span className="font-medium text-violet-900 dark:text-violet-100">
              {t("remaining", { remaining: credits.remaining })}
            </span>
          </div>
        </>
      )}

      {isUnlimited && (
        <div className="text-sm text-violet-900 dark:text-violet-100">
          {t("unlimited")}
        </div>
      )}

      {/* Upgrade Prompt */}
      {credits.remaining <= 5 && credits.tier !== "pro" && (
        <div className="mt-3 pt-2 border-t border-violet-200 dark:border-violet-800">
          <Link
            href={credits.tier === "unverified" ? "/auth/signin" : "/pricing"}
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline block"
          >
            {credits.tier === "unverified" ? t("verify_email") : t("upgrade_pro")}
          </Link>
        </div>
      )}
    </div>
  );
}
