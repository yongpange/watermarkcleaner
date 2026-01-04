"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link } from "@/i18n/routing";
import LocaleToggle from "@/components/locale/toggle";
import { Menu, User, CreditCard, LogOut, ChevronDown } from "lucide-react";
import ThemeToggle from "@/components/theme/toggle";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/auth-modal";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

interface CreditsInfo {
  tier: "unverified" | "verified" | "pro";
  used: number;
}

export default function Header({ header }: { header: HeaderType }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: session, status } = useSession();
  const t = useTranslations();

  // 用户基本信息（从 session 获取）
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || '';
  const userEmail = session?.user?.email || '';

  // 额度信息（主动查询，不是从 session）
  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // 获取用户额度（实时查询，不依赖 session）
  useEffect(() => {
    async function fetchCredits() {
      if (status !== "authenticated" || !session?.user) {
        setCreditsInfo(null);
        return;
      }

      setCreditsLoading(true);
      try {
        const response = await fetch("/api/credits/check");
        if (response.ok) {
          const data = await response.json();
          setCreditsInfo({
            tier: data.tier,
            used: data.used
          });
        }
      } catch (error) {
        console.error("Failed to fetch credits in header:", error);
        // Fallback to session data if API fails
        setCreditsInfo({
          tier: (session.user as any)?.tier || 'unverified',
          used: (session.user as any)?.creditsused || 0
        });
      } finally {
        setCreditsLoading(false);
      }
    }

    fetchCredits();
  }, [session, status]);

  // 计算额度显示
  const userTier = creditsInfo?.tier || (session?.user as any)?.tier || 'unverified';
  const creditsUsed = creditsInfo?.used ?? ((session?.user as any)?.creditsused || 0);
  const creditsLimit = userTier === 'pro' ? '∞' : userTier === 'verified' ? 10 : 3;

  if (header.disabled) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <section className="py-3">
      <div className="container">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Link
              href={(header.brand?.url || "/") as any}
              className="flex items-center gap-2"
            >
              {header.brand?.title && (
                <span className="text-xl text-primary font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {header.nav?.items?.map((item, i) => {
                    if (item.children && item.children.length > 0) {
                      return (
                        <NavigationMenuItem
                          key={i}
                          className="text-muted-foreground"
                        >
                          <NavigationMenuTrigger>
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0 mr-2"
                              />
                            )}
                            <span>{item.title}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="w-80 p-3">
                              <NavigationMenuLink>
                                {item.children.map((iitem, ii) => (
                                  <li key={ii}>
                                    <Link
                                      className={cn(
                                        "flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      )}
                                      href={(iitem.url || "/") as any}
                                      target={iitem.target}
                                    >
                                      {iitem.icon && (
                                        <Icon
                                          name={iitem.icon}
                                          className="size-5 shrink-0"
                                        />
                                      )}
                                      <div>
                                        <div className="text-sm font-semibold">
                                          {iitem.title}
                                        </div>
                                        <p className="text-sm leading-snug text-muted-foreground">
                                          {iitem.description}
                                        </p>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </NavigationMenuLink>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem key={i}>
                        <Link
                          className={cn(
                            "text-muted-foreground",
                            navigationMenuTriggerStyle,
                            buttonVariants({
                              variant: "ghost",
                            })
                          )}
                          href={(item.url || "/") as any}
                          target={item.target}
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-0"
                            />
                          )}
                          {item.title}
                        </Link>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="shrink-0 flex gap-2 items-center">
            {header.show_locale && <LocaleToggle />}
            {header.show_theme && <ThemeToggle />}

            {header.buttons?.map((item, i) => {
              return (
                <Button key={i} variant={item.variant}>
                  <Link
                    href={(item.url || "/") as any}
                    target={item.target || ""}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    {item.title}
                    {item.icon && (
                      <Icon name={item.icon} className="size-4 shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}

            {/* 登录状态展示 */}
            {status === "authenticated" && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback>
                        {userName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">
                      {userName} ({creditsUsed}/{creditsLimit})
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium text-foreground">{userName}</div>
                    <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/convert" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      我的额度 ({creditsUsed}/{creditsLimit})
                    </Link>
                  </DropdownMenuItem>

                  {userTier !== 'pro' && (
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className="flex items-center gap-2 cursor-pointer">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        升级专业版
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="cursor-pointer"
              >
                登录
              </Button>
            )}
          </div>
        </nav>

        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link
              href={(header.brand?.url || "/") as any}
              className="flex items-center gap-2"
            >
              {header.brand?.title && (
                <span className="text-xl font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      href={(header.brand?.url || "/") as any}
                      className="flex items-center gap-2"
                    >
                      {header.brand?.title && (
                        <span className="text-xl font-bold">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-8 flex flex-col gap-4">
                  <Accordion type="single" collapsible className="w-full">
                    {header.nav?.items?.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline text-left">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="mt-2">
                              {item.children.map((iitem, ii) => (
                                <Link
                                  key={ii}
                                  className={cn(
                                    "flex select-none gap-4 rounded-md p-3 leading-none outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  )}
                                  href={(iitem.url || "/") as any}
                                  target={iitem.target}
                                >
                                  {iitem.icon && (
                                    <Icon
                                      name={iitem.icon}
                                      className="size-4 shrink-0"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-semibold">
                                      {iitem.title}
                                    </div>
                                    <p className="text-sm leading-snug text-muted-foreground">
                                      {iitem.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <Link
                          key={i}
                          href={(item.url || "/") as any}
                          target={item.target}
                          className="font-semibold my-4 flex items-center gap-2 px-4"
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0"
                            />
                          )}
                          {item.title}
                        </Link>
                      );
                    })}
                  </Accordion>
                </div>
                <div className="flex-1"></div>
                <div className="border-t pt-4">
                  {/* 登录状态展示（移动端） */}
                  {status === "authenticated" && session?.user ? (
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.user.image || undefined} />
                          <AvatarFallback>
                            {userName?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{userName}</div>
                          <div className="text-xs text-muted-foreground">{userEmail}</div>
                          <div className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                            额度: {creditsUsed}/{creditsLimit}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 px-2">
                        <Link
                          href="/convert"
                          className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "flex items-center gap-2 justify-start"
                          )}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">我的额度</span>
                        </Link>

                        {userTier !== 'pro' && (
                          <Link
                            href="/pricing"
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              "flex items-center gap-2 justify-start"
                            )}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-sm">升级</span>
                          </Link>
                        )}

                        <button
                          onClick={handleSignOut}
                          className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "col-span-2 flex items-center gap-2 justify-start text-red-600 hover:text-red-600"
                          )}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">退出登录</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-3">
                      {header.buttons?.map((item, i) => {
                        return (
                          <Button key={i} variant={item.variant}>
                            <Link
                              href={(item.url || "/") as any}
                              target={item.target || ""}
                              className="flex items-center gap-1"
                            >
                              {item.title}
                              {item.icon && (
                                <Icon
                                  name={item.icon}
                                  className="size-4 shrink-0"
                                />
                              )}
                            </Link>
                          </Button>
                        );
                      })}

                      {/* 移动端登录按钮 */}
                      <Button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full"
                      >
                        登录
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    {header.show_locale && <LocaleToggle />}
                    <div className="flex-1"></div>

                    {header.show_theme && <ThemeToggle />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* 认证弹窗 */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="email-code"
        />
      </div>
    </section>
  );
}
