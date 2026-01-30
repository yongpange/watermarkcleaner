"use client";

export const runtime = 'edge';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();

  // Auto-redirect to dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard"); 
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="text-4xl">🎉</div>
      <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
      <p className="text-gray-500">Redirecting you to your dashboard...</p>
    </div>
  );
}
