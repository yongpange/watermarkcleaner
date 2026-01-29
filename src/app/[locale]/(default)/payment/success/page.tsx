"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";

function SuccessContent() {
  const router = useRouter();
  const t = useTranslations("common");
  
  // Auto-redirect to workspace after payment
  useEffect(() => {
    const timer = setTimeout(() => {
      // Redirect to workspace/convert page where they can use their credits
      router.push("/convert");
    }, 1500); // 1.5s delay to show success state briefly

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container max-w-lg py-32 flex flex-col items-center justify-center text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
        <Loader2 className="w-16 h-16 text-green-600 animate-spin relative z-10" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-green-700">Payment Successful!</h1>
        <p className="text-muted-foreground animate-pulse">
          Redirecting to workspace...
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container py-32 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
