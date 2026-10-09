"use client";

import { Check, Loader } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { getRealProductId } from "@/lib/payment/products";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

export default function Pricing({ pricing }: { pricing: PricingType }) {
  const { user, setShowSignModal } = useAppContext();
  const locale = useLocale();

  const [group, setGroup] = useState(pricing.groups?.find(g => g.name === "monthly")?.name || pricing.groups?.[0]?.name || "monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      if (!user) {
        setShowSignModal(true);
        return;
      }

      const params = {
        product_id: item.product_id,
        amount: cn_pay ? item.cn_amount : (item.amount || 0), // Free 计划 amount 为 0
        currency: cn_pay ? "cny" : (item.currency || 'usd'),
        // 可选字段，如果有值才传递
        ...(item.valid_months && { valid_months: item.valid_months }),
        success_url: (item.amount === 0 || item.product_id === 'free-plan')
          ? `${window.location.origin}/${locale}`
          : `${window.location.origin}/${locale}/payment/success`,
        cancel_url: `${window.location.origin}/${locale}/payment/cancel`,
        locale: locale
      };
      
      console.log('Checkout params:', {
        ...params,
        locale,
        origin: window.location.origin
      });

      setIsLoading(true);
      setProductId(item.product_id);

      const realProductId = getRealProductId(item.product_id);
      
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Merge params first (contains product_id from item.product_id)
          ...params,
          // Explicitly overwrite/ensure snake_case keys for the API
          product_id: realProductId, 
          provider_product_id: realProductId, 
          payment_provider: "creem", 
        }),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);

        setShowSignModal(true);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || result.message || "checkout failed");
        setIsLoading(false);
        setProductId(null);
        return;
      }

      // 处理支付响应 - 兼容 Creem 和 Stripe 格式
      const { data } = result;
      console.log('Checkout response data:', data);

      if (data.checkoutUrl) {
        // Creem 格式 - 直接跳转
        console.log('Redirecting to (Creem):', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else if (data.checkout_url) {
        // 其他格式 - 直接跳转
        console.log('Redirecting to (Other):', data.checkout_url);
        window.location.href = data.checkout_url;
      } else if (data.public_key && data.session_id) {
        // 兼容旧的 Stripe 格式
        const stripe = await loadStripe(data.public_key);
        if (!stripe) {
          toast.error("checkout failed");
          setIsLoading(false);
          setProductId(null);
          return;
        }

        const stripeResult = await stripe.redirectToCheckout({
          sessionId: data.session_id,
        });

        if (stripeResult.error) {
          toast.error(stripeResult.error.message);
        }
      } else {
        toast.error("Invalid checkout response");
        setIsLoading(false);
        setProductId(null);
      }
    } catch (e) {
      console.log("checkout failed: ", e);

      toast.error("checkout failed");
    } finally {
      setIsLoading(false);
      setProductId(null);
    }
  };

  useEffect(() => {
    if (pricing.disabled) return;

    if (pricing.items && pricing.items.length > 0) {
      // 优先选择 monthly 分组的第一个产品
      const monthlyItem = pricing.items.find(item => item.group === "monthly");
      if (monthlyItem && monthlyItem.group) {
        setGroup(monthlyItem.group);
        setProductId(monthlyItem.product_id);
      } else {
        // 回退到第一个产品
        const firstItem = pricing.items[0];
        if (firstItem.group) {
          setGroup(firstItem.group);
          setProductId(firstItem.product_id);
        }
      }
      setIsLoading(false);
    }
  }, [pricing.items, pricing.disabled]);

  if (pricing.disabled) {
    return null;
  }

  const visibleItems = pricing.items?.filter(
    (item) => !item.group || item.group === group
  ) || [];

  const gridCols: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <section id={pricing.name} className="py-24 bg-background">
      <div className="container">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {pricing.title}
          </h2>
          {pricing.description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {pricing.description}
            </p>
          )}
        </FadeIn>

        <div className="flex flex-col items-center gap-10">
          {pricing.groups && pricing.groups.length > 0 && (
            <FadeIn delay={0.1}>
              <div className="relative flex items-center rounded-xl bg-muted p-1.5 shadow-sm">
                {pricing.groups.map((item, i) => {
                  const isActive = group === item.name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGroup(item.name || "")}
                      className={cn(
                        "relative z-10 flex h-10 items-center justify-center gap-2 px-5 text-sm font-medium transition-colors duration-200 sm:px-7 sm:text-base",
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activePricingGroup"
                          className="absolute inset-0 rounded-lg bg-background shadow"
                          transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        />
                      )}
                      <span className="relative z-10">{item.title}</span>
                      {item.label && (
                        <Badge
                          variant="outline"
                          className="relative z-10 border-primary/30 bg-primary/10 px-1.5 text-xs text-primary"
                        >
                          {item.label}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </FadeIn>
          )}

          <div
            className={cn(
              "w-full grid gap-6",
              gridCols[visibleItems.length] || "md:grid-cols-3"
            )}
          >
            {visibleItems.map((item, index) => {
              const featured = item.is_featured;

              return (
                <FadeIn key={index} delay={0.15 + index * 0.08}>
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border bg-card p-7 sm:p-8 transition-all duration-300",
                      featured
                        ? "border-primary shadow-glow"
                        : "border-border shadow hover:shadow-md"
                    )}
                  >
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center justify-between gap-3">
                        {item.title && (
                          <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                            {item.title}
                          </h3>
                        )}
                        {!featured && item.label && (
                          <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/10 px-2 text-xs text-primary"
                          >
                            {item.label}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mb-6 flex items-baseline gap-2">
                      {item.original_price && (
                        <span className="text-base text-muted-foreground line-through">
                          {item.original_price}
                        </span>
                      )}
                      {item.price && (
                        <span className="text-5xl font-mono font-semibold tracking-tight text-foreground">
                          {item.price}
                        </span>
                      )}
                      {item.unit && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {item.unit}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      {item.features_title && (
                        <p className="mb-3 text-sm font-semibold text-foreground">
                          {item.features_title}
                        </p>
                      )}
                      {item.features && (
                        <ul className="flex flex-col gap-3">
                          {item.features.map((feature, fi) => (
                            <li
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                              key={`feature-${fi}`}
                            >
                              <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                      {item.cn_amount && item.cn_amount > 0 ? (
                        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
                          <span className="text-sm text-muted-foreground">人民币支付</span>
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md p-1 transition-colors hover:bg-accent/10"
                            onClick={() => {
                              if (isLoading) return;
                              handleCheckout(item, true);
                            }}
                          >
                            <Image
                              src="/imgs/cnpay.png"
                              alt="China payment methods"
                              width={80}
                              height={40}
                              className="h-8 w-auto rounded-md object-contain"
                            />
                          </button>
                        </div>
                      ) : null}

                      {item.button && (
                        <Button
                          variant={featured ? "glow" : "default"}
                          size="lg"
                          className="w-full gap-2 font-semibold"
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading) return;
                            handleCheckout(item);
                          }}
                        >
                          {isLoading && productId === item.product_id ? (
                            <>
                              <Loader className="size-4 animate-spin" />
                              <span>{item.button.title}</span>
                            </>
                          ) : (
                            <>
                              <span>{item.button.title}</span>
                              {item.button.icon && (
                                <Icon name={item.button.icon} className="size-4" />
                              )}
                            </>
                          )}
                        </Button>
                      )}

                      {item.tip && (
                        <p className="text-center text-xs text-muted-foreground">
                          {item.tip}
                        </p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
