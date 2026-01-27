"use client";

import Analytics from "@/components/analytics";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import AuthModal from "@/components/auth/auth-modal";
import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useAppContext } from "@/contexts/app";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { showSignModal, setShowSignModal } = useAppContext();

  return (
    <NextThemesProvider
      defaultTheme={process.env.NEXT_PUBLIC_DEFAULT_THEME || "light"}
      enableSystem
      storageKey="theme"
      {...props}
    >
      {children}

      <Toaster position="top-center" richColors />
      <AuthModal isOpen={showSignModal} onClose={() => setShowSignModal(false)} />
      <Analytics />
    </NextThemesProvider>
  );
}
