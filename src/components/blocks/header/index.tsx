"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link } from "@/i18n/routing";
import LocaleToggle from "@/components/locale/toggle";
import { Menu, User, CreditCard, LogOut, ChevronDown, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/theme/toggle";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/auth-modal";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { USER_TIER_CONFIG } from "@/lib/credits/config";
import type { User as NextAuthUser } from "@/types/next-auth";
import { Link as NextIntlLink } from "@/i18n/routing";
import type { AppPathname } from "@/i18n/locale";
import { motion, AnimatePresence } from "framer-motion";

const SafeLink = ({
  href,
  children,
  className,
  target,
  ...props
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const url = href || "/";
  const isExternal = url.startsWith("http://") || url.startsWith("https://");

  if (!isExternal) {
    return (
      <NextIntlLink href={url as any} className={className} {...props}>
        {children}
      </NextIntlLink>
    );
  }

  return (
    <a
      href={url}
      className={className}
      target={target || "_blank"}
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
};

function JournalMenu({
  items,
  href,
  label,
  className,
}: {
  items: { title?: string; description?: string; url?: string; target?: string }[];
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-[24rem] max-w-[calc(100vw-2rem)] py-2", className)}>
      <ul>
        {items.map((entry, index) => (
          <li key={entry.url || index}>
            <NavigationMenuLink asChild>
              <SafeLink
                href={entry.url || "/blog"}
                target={entry.target}
                className="grid grid-cols-[1.75rem_1fr] gap-3 rounded-md px-4 py-3 no-underline outline-hidden transition-colors hover:bg-accent/70"
              >
                <span className="pt-0.5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium leading-snug tracking-tight text-foreground">
                    {entry.title}
                  </span>
                  {entry.description ? (
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                      {entry.description}
                    </span>
                  ) : null}
                </span>
              </SafeLink>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
      <div className="mx-4 mt-1 border-t border-border/80 px-1 pt-2 pb-1">
        <NavigationMenuLink asChild>
          <SafeLink
            href={href || "/blog"}
            className="flex items-center justify-between py-2 text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            <span>{label}</span>
            <span aria-hidden="true">→</span>
          </SafeLink>
        </NavigationMenuLink>
      </div>
    </div>
  );
}

interface CreditsInfo {
  tier: "unverified" | "verified" | "pro";
  used: number;
  remaining?: number;
}

export default function Header({ header }: { header: HeaderType }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const t = useTranslations("header");
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "";
  const userEmail = session?.user?.email || "";

  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            used: data.used,
            remaining: data.remaining,
          });
        }
      } catch (error) {
        setCreditsInfo({
          tier: session?.user?.tier || "unverified",
          used: session?.user?.creditsUsed || 0,
          remaining: undefined,
        });
      } finally {
        setCreditsLoading(false);
      }
    }

    fetchCredits();

    const handleCreditUpdate = () => fetchCredits();
    window.addEventListener("credit-update", handleCreditUpdate);
    return () => window.removeEventListener("credit-update", handleCreditUpdate);
  }, [session, status]);

  const userTier = creditsInfo?.tier || session?.user?.tier || "unverified";
  const creditsUsed = creditsInfo?.used ?? (session?.user?.creditsUsed || 0);
  const creditsRemaining = creditsInfo?.remaining;
  const showRemaining = creditsRemaining !== undefined;

  const creditsLimit =
    USER_TIER_CONFIG[userTier as keyof typeof USER_TIER_CONFIG]?.maxPerMonth === Infinity
      ? "∞"
      : USER_TIER_CONFIG[userTier as keyof typeof USER_TIER_CONFIG]?.maxPerMonth || 3;

  if (header.disabled) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/75 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container">
        <nav className="hidden justify-between items-center h-16 lg:flex">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <SafeLink
              href={header.brand?.url || "/"}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
              {header.brand?.title && (
                <span className="text-lg font-display font-semibold tracking-tight text-foreground">
                  {header.brand?.title || ""}
                </span>
              )}
            </SafeLink>

            <NavigationMenu>
              <NavigationMenuList>
                {header.nav?.items?.map((item, i) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <NavigationMenuItem key={i} className="text-muted-foreground">
                        <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground data-[state=open]:text-foreground">
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-2"
                            />
                          )}
                          <span>{item.title}</span>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          {item.url === "/blog" ? (
                            <JournalMenu
                              items={item.children}
                              href={item.url}
                              label={item.title}
                            />
                          ) : (
                            <ul className="w-80 p-2">
                              {item.children.map((iitem, ii) => (
                                <li key={ii}>
                                  <NavigationMenuLink asChild>
                                    <SafeLink
                                      className="flex select-none gap-4 rounded-xl p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      href={iitem.url || "/"}
                                      target={iitem.target}
                                    >
                                      {iitem.icon && (
                                        <Icon
                                          name={iitem.icon}
                                          className="size-5 shrink-0 text-muted-foreground"
                                        />
                                      )}
                                      <div>
                                        <div className="text-sm font-medium">
                                          {iitem.title}
                                        </div>
                                        <p className="text-sm leading-snug text-muted-foreground">
                                          {iitem.description}
                                        </p>
                                      </div>
                                    </SafeLink>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          )}
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }

                  return (
                    <NavigationMenuItem key={i}>
                      <SafeLink
                        className={cn(
                          "relative text-sm font-medium transition-colors text-muted-foreground hover:text-foreground after:bg-primary",
                          navigationMenuTriggerStyle,
                          buttonVariants({ variant: "ghost" }),
                          "after:absolute after:bottom-1 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:transition-all after:duration-200 hover:after:w-4/5"
                        )}
                        href={item.url || "/"}
                        target={item.target}
                      >
                        {item.icon && (
                          <Icon name={item.icon} className="size-4 shrink-0 mr-1.5" />
                        )}
                        {item.title}
                      </SafeLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right: Actions */}
          <div className="shrink-0 flex items-center gap-1">
            {header.show_locale && <LocaleToggle />}
            {header.show_theme && <ThemeToggle />}

            {header.buttons?.map((item, i) => (
              <Button key={i} variant={item.variant} className="ml-2">
                <SafeLink
                  href={item.url || "/"}
                  target={item.target || ""}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  {item.title}
                  {item.icon && <Icon name={item.icon} className="size-4 shrink-0" />}
                </SafeLink>
              </Button>
            ))}

            {status === "authenticated" && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 pl-2 pr-3 ml-2 h-9 rounded-full border border-border/50 hover:bg-accent/50 text-foreground"
                  >
                    <Avatar className="w-6 h-6 ring-1 ring-border/50">
                      <AvatarImage src={session.user.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {userName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
                      {userName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="hidden lg:inline-flex text-xs px-1.5 py-0 h-5 font-mono"
                    >
                      {showRemaining ? creditsRemaining : `${creditsUsed}/${creditsLimit}`}
                    </Badge>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium text-foreground">{userName}</div>
                    <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <SafeLink href="/convert" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      {t("my_credits")}{" "}
                      {showRemaining ? `(${creditsRemaining})` : `(${creditsUsed}/${creditsLimit})`}
                    </SafeLink>
                  </DropdownMenuItem>
                  {userTier !== "pro" && (
                    <DropdownMenuItem asChild>
                      <SafeLink href="/pricing" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4" />
                        {t("upgrade_pro")}
                      </SafeLink>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="cursor-pointer ml-2"
                variant="glow"
              >
                {t("sign_in")}
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <SafeLink href={header.brand?.url || "/"} className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden ring-1 ring-border/50">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            {header.brand?.title && (
              <span className="text-base font-display font-semibold tracking-tight text-foreground">
                {header.brand?.title}
              </span>
            )}
          </SafeLink>

          <div className="flex items-center gap-1">
            {header.show_theme && <ThemeToggle />}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:bg-accent/50">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-80 overflow-y-auto bg-background/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle>
                    <SafeLink href={header.brand?.url || "/"} className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                        <Image src="/logo.png" alt="Logo" fill className="object-cover" />
                      </div>
                      {header.brand?.title && (
                        <span className="text-lg font-display font-semibold">
                          {header.brand?.title}
                        </span>
                      )}
                    </SafeLink>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-2">
                  <Accordion type="single" collapsible className="w-full">
                    {header.nav?.items?.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="py-3 text-base font-medium hover:no-underline hover:bg-accent/50 rounded-lg px-3">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="pl-1">
                              {item.url === "/blog" ? (
                                <JournalMenu
                                  items={item.children}
                                  href={item.url}
                                  label={item.title}
                                  className="w-full max-w-none"
                                />
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {item.children.map((iitem, ii) => (
                                    <SafeLink
                                      key={ii}
                                      className="flex select-none gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
                                      href={iitem.url || "/"}
                                      target={iitem.target}
                                    >
                                      {iitem.icon && (
                                        <Icon name={iitem.icon} className="size-5 shrink-0 text-muted-foreground" />
                                      )}
                                      <div>
                                        <div className="text-sm font-medium">{iitem.title}</div>
                                        <p className="text-xs text-muted-foreground">{iitem.description}</p>
                                      </div>
                                    </SafeLink>
                                  ))}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <SafeLink
                          key={i}
                          href={item.url || "/"}
                          target={item.target}
                          className="font-medium py-3 px-3 flex items-center gap-2 rounded-lg hover:bg-accent/50"
                        >
                          {item.icon && <Icon name={item.icon} className="size-4 shrink-0" />}
                          {item.title}
                        </SafeLink>
                      );
                    })}
                  </Accordion>
                </div>

                <div className="mt-8 pt-6 border-t">
                  {status === "authenticated" && session?.user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <Avatar className="w-10 h-10 ring-1 ring-border/50">
                          <AvatarImage src={session.user.image ?? undefined} />
                          <AvatarFallback>{userName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{userName}</div>
                          <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                          <div className="text-xs text-primary mt-1 font-mono">
                            {showRemaining ? creditsRemaining : `${creditsUsed}/${creditsLimit}`} credits
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <SafeLink
                          href="/convert"
                          className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "flex items-center gap-2 justify-start"
                          )}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">{t("my_credits")}</span>
                        </SafeLink>
                        {userTier !== "pro" && (
                          <SafeLink
                            href="/pricing"
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              "flex items-center gap-2 justify-start"
                            )}
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm">{t("upgrade_pro")}</span>
                          </SafeLink>
                        )}
                        <button
                          onClick={handleSignOut}
                          className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "col-span-2 flex items-center gap-2 justify-start text-destructive hover:text-destructive"
                          )}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">{t("sign_out")}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {header.buttons?.map((item, i) => (
                        <Button key={i} variant={item.variant} className="w-full">
                          <SafeLink
                            href={item.url || "/"}
                            target={item.target || ""}
                            className="flex items-center justify-center gap-1.5"
                          >
                            {item.title}
                            {item.icon && <Icon name={item.icon} className="size-4" />}
                          </SafeLink>
                        </Button>
                      ))}
                      <Button onClick={() => setShowAuthModal(true)} className="w-full" variant="glow">
                        {t("sign_in")}
                      </Button>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between px-2">
                    {header.show_locale && <LocaleToggle />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
}
