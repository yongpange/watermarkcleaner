"use client";

import { BsMoonStars, BsSun } from "react-icons/bs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return <div className="w-5 h-5" />;
  }

  const currentTheme = resolvedTheme || theme;

  return (
    <div className="flex items-center gap-x-2 px-2">
      {currentTheme === "dark" ? (
        <BsSun
          className={cn("cursor-pointer text-lg transition-colors", className || "text-muted-foreground hover:text-foreground")}
          onClick={() => setTheme("light")}
        />
      ) : (
        <BsMoonStars
          className={cn("cursor-pointer text-lg transition-colors", className || "text-muted-foreground hover:text-foreground")}
          onClick={() => setTheme("dark")}
        />
      )}
    </div>
  );
};

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
