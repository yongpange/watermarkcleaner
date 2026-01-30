"use client";

export const runtime = 'edge';

import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="text-4xl">❌</div>
      <h1 className="text-2xl font-bold text-red-600">Payment Canceled</h1>
      <p className="text-gray-500">You have not been charged.</p>
      <Link href="/pricing" className="text-blue-500 hover:underline">
        Return to Pricing
      </Link>
    </div>
  );
}
