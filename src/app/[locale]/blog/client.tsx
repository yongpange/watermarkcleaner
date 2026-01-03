"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Grid, List } from "lucide-react";
import BlogBreadcrumb from "@/components/blocks/blog/breadcrumb";
import BlogCard from "@/components/blocks/blog/blog-card";
import type { LocalizedPostSummary } from "@/lib/blog";

interface BlogClientProps {
  initialPosts: LocalizedPostSummary[];
}

// 分类键列表
const categoryKeys = ["all", "ai_learning", "study_science", "comparison", "tips", "updates"];

export default function BlogClient({ initialPosts }: BlogClientProps) {
  const t = useTranslations("blog");
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "readTime" | "title">("date");

  // 使用 useMemo 优化过滤逻辑
  const filteredPosts = useMemo(() => {
    let filtered = initialPosts;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.description.toLowerCase().includes(term) ||
        post.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        case "readTime":
          return a.readTime - b.readTime;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy, initialPosts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* 面包屑导航 */}
            <BlogBreadcrumb />

            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t("hero_title")}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t("hero_description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg border-2 border-primary/20 focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categoryKeys.map((categoryKey) => (
                  <Button
                    key={categoryKey}
                    variant={selectedCategory === categoryKey ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(categoryKey)}
                    className="rounded-full"
                  >
                    {t(`categories.${categoryKey}`)}
                  </Button>
                ))}
              </div>

              {/* View and Sort Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-primary/20 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="date">Sort by Date</option>
                  <option value="readTime">Sort by Read Time</option>
                  <option value="title">Sort by Title</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-primary/20 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none border-r border-primary/20"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-center text-sm text-muted-foreground">
              {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid/List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t("no_results")}</h3>
              <p className="text-muted-foreground">{t("no_results_hint")}</p>
            </div>
          ) : (
            <div className={`grid gap-8 max-w-7xl mx-auto ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 max-w-4xl"
            }`}>
              {filteredPosts.map((post) => (
                <BlogCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">{t("newsletter.title")}</h3>
            <p className="text-muted-foreground mb-8">
              {t("newsletter.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1"
              />
              <Button className="bg-primary hover:bg-primary/90">
                {t("newsletter.button")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}