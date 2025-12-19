"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface CreditsInfo {
  tier: "unverified" | "verified" | "pro";
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Displays user's monthly credits in the UI
 * Shows current usage, tier information, and upgrade options
 */
export function CreditsDisplay() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch credits info when user is authenticated
  useEffect(() => {
    async function fetchCredits() {
      if (status === "authenticated" && session?.user) {
        setLoading(true);
        try {
          const response = await fetch("/api/credits/check");
          if (response.ok) {
            const data = await response.json();
            setCredits(data);
          }
        } catch (error) {
          console.error("Failed to fetch credits:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchCredits();
  }, [session, status]);

  // Don't show for unauthenticated users or while loading
  if (status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading credits...</span>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  const tierNames = {
    unverified: "免费试用",
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
              本月使用: {credits.used} / {credits.limit} 张
            </span>
            <span className="font-medium text-violet-900 dark:text-violet-100">
              剩余: {credits.remaining} 张
            </span>
          </div>
        </>
      )}

      {isUnlimited && (
        <div className="text-sm text-violet-900 dark:text-violet-100">
          ✨ 无限额度
        </div>
      )}

      {/* Upgrade Prompt */}
      {credits.remaining <= 5 && credits.tier !== "pro" && (
        <div className="mt-3 pt-2 border-t border-violet-200 dark:border-violet-800">
          <Link
            href={credits.tier === "unverified" ? "/auth/signin" : "/pricing"}
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline block"
          >
            {credits.tier === "unverified"
              ? "🔐 验证邮箱获得更多额度 →"
              : "💎 升级专业版获得无限额度 →"}
          </Link>
        </div>
      )}
    </div>
  );
}
