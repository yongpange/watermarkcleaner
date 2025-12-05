"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Search, Tag, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/routing";
import BlogBreadcrumb from "@/components/blocks/blog/breadcrumb";
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

    return filtered;
  }, [searchTerm, selectedCategory, initialPosts]);

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

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
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
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t("no_results")}</h3>
              <p className="text-muted-foreground">{t("no_results_hint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredPosts.map((post) => (
                <article key={post.slug} className="group">
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/10">
                    <CardHeader className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {post.categoryName}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{t("min_read", { minutes: post.readTime })}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-muted-foreground line-clamp-3">
                          {post.description}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Author and Date */}
                      <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {post.authorName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{post.authorName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.publishDate).toLocaleDateString(locale, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={{
                            pathname: "/blog/[slug]",
                            params: { slug: post.slug },
                          }}
                        >
                          <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                            {t("read_more")}
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </article>
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