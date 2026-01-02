"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme";
import { Toaster } from "react-hot-toast";

export default function AppProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {children}
        <Toaster position="top-center" />
      </ThemeProvider>
    </SessionProvider>
  );
}
