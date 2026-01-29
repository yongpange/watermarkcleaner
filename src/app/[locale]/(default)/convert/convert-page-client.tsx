"use client";

import { useState } from "react";
import WatermarkEditor from "@/components/watermark-editor";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { AuthModal } from "@/components/auth/auth-modal";

/**
 * Client component for interactive parts of the convert page
 * Manages state for credits refresh after image processing and auth modal
 */
export function ConvertPageClient() {
  // State to track processing count for refreshing credits
  const [processingCount, setProcessingCount] = useState(0);

  // State for auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Callback to refresh credits after successful processing
  const handleProcessingComplete = () => {
    // Add a small delay to ensure DB replication/propagation catches up
    // This prevents fetching stale credit data immediately after write
    setTimeout(() => {
        setProcessingCount(prev => prev + 1);
        // Dispatch global event for Header and other components
        window.dispatchEvent(new CustomEvent('credit-update'));
    }, 500); 
  };

  // Callback to open auth modal
  const handleVerifyEmail = () => {
    setAuthModalOpen(true);
  };

  return (
    <>
      {/* Credits Display */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* refreshKey forces re-fetch of credits data after each processing */}
        <CreditsDisplay
          refreshKey={processingCount}
          onVerifyEmail={handleVerifyEmail}
        />
      </div>

      {/* Editor */}
      <WatermarkEditor onProcessingComplete={handleProcessingComplete} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
