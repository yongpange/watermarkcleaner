"use client";

import { useState } from "react";
import WatermarkEditor from "@/components/watermark-editor";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { VerificationPrompt } from "@/components/VerificationPrompt";

/**
 * Client component for interactive parts of the convert page
 * Manages state for credits refresh after image processing
 */
export function ConvertPageClient() {
  // State to track processing count for refreshing credits
  const [processingCount, setProcessingCount] = useState(0);

  // Callback to refresh credits after successful processing
  const handleProcessingComplete = () => {
    setProcessingCount(prev => prev + 1);
  };

  return (
    <>
      {/* Verification Prompt and Credits Display */}
      <div className="max-w-4xl mx-auto space-y-6">
        <VerificationPrompt />
        {/* Key prop forces re-render when processingCount changes */}
        <CreditsDisplay key={processingCount} />
      </div>

      {/* Editor */}
      <WatermarkEditor onProcessingComplete={handleProcessingComplete} />
    </>
  );
}
