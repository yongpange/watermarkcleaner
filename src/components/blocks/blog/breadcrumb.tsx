"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface BlogBreadcrumbProps {
  /** 当前页面标题（可选）。如果提供，将显示为面包屑的最后一级 */
  currentPage?: string;
}

/**
 * 博客面包屑导航组件
 * 
 * 使用示例：
 * - 博客列表页：<BlogBreadcrumb />  → 🏠 → Blog
 * - 文章详情页：<BlogBreadcrumb currentPage="文章标题" />  → 🏠 → Blog → 文章标题
 */
export default function BlogBreadcrumb({ currentPage }: BlogBreadcrumbProps) {
  const locale = useLocale();
  const t = useTranslations();

  // 根据语言设置链接路径
  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const blogHref = locale === "en" ? "/blog" : `/${locale}/blog`;

  return (
    <Breadcrumb className="mb-8">
      <BreadcrumbList>
        {/* 首页 */}
        <BreadcrumbItem>
          <BreadcrumbLink href={homeHref}>
            <Home className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* 博客列表页 */}
        {currentPage ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={blogHref}>
                {t("blog.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {/* 当前文章页 */}
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{t("blog.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

