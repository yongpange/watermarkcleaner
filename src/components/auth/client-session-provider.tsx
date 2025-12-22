"use client";

import { SessionProvider } from "next-auth/react";
import { VerificationPrompt } from "@/components/VerificationPrompt";
import { CreditsDisplay } from "@/components/CreditsDisplay";

/**
 * Client wrapper for NextAuth SessionProvider
 * This component wraps the content with SessionProvider
 * to make session data available to child components
 */
export function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="space-y-6">
        {/* Verification Prompt for unauthenticated users */}
        <div className="max-w-4xl mx-auto">
          <VerificationPrompt />
        </div>

        {/* Credits Display for all users */}
        <div className="max-w-4xl mx-auto">
          <CreditsDisplay />
        </div>

        {/* Main content */}
        {children}
      </div>
    </SessionProvider>
  );
}
