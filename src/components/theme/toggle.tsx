"use client";

import { BsMoonStars, BsSun } from "react-icons/bs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
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
          className="cursor-pointer text-lg text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setTheme("light")}
        />
      ) : (
        <BsMoonStars
          className="cursor-pointer text-lg text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setTheme("dark")}
        />
      )}
    </div>
  );
};

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
