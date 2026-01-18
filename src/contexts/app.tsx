"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  // 同时支持 NextAuth.js (Google OAuth) 和 Supabase Auth
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { user: supabaseUser, loading: supabaseLoading } = useSupabaseAuth();

  const [theme, setTheme] = useState<string>(() => {
    const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME;
    if (defaultTheme && ["dark", "light"].includes(defaultTheme)) {
      return defaultTheme;
    }
    return "light"; // Default to light
  });

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // 优先使用 NextAuth.js session（Google OAuth），回退到 Supabase Auth
  const effectiveUser = nextAuthSession?.user || supabaseUser;
  const isLoading = nextAuthStatus === "loading" || supabaseLoading;

  const fetchUserInfo = useCallback(async function () {
    try {
      // 使用 NextAuth 获取用户信息
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
    } catch (_e) {
      console.log("fetch user info failed");
    }
  }, []);

  useEffect(() => {
    if (effectiveUser && !isLoading) {
      fetchUserInfo();
    }
  }, [effectiveUser, isLoading, fetchUserInfo]);

  // 构建统一的 user 对象，优先使用 NextAuth 数据
  const unifiedUser = user || (effectiveUser ? {
    id: effectiveUser.id,
    email: effectiveUser.email,
    name: effectiveUser.name,
    image: effectiveUser.image,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } : null);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        user: unifiedUser,
        setUser,
        showFeedback,
        setShowFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
