import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Tag, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { LocalizedPostSummary } from "@/lib/blog";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface BlogCardProps {
  post: LocalizedPostSummary;
  locale: string;
}

export default function BlogCard({ post, locale }: BlogCardProps) {
  const t = useTranslations("blog");

  return (
    <article className="group h-full">
      <Link
        href={{
          pathname: "/blog/[slug]",
          params: { slug: post.slug },
        }}
        className="block h-full"
      >
        <Card className="h-full overflow-hidden border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="relative h-48 overflow-hidden bg-muted">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-sky-200/40 to-amber-100/50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            {post.featured && (
              <Badge className="absolute top-3 left-3 border-0 bg-background/90 text-foreground hover:bg-background/90">
                {t("featured")}
              </Badge>
            )}
          </div>

          <CardHeader className="space-y-3 pb-2">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary" className="text-xs">
                {post.categoryName}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{t("min_read", { minutes: post.readTime })}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="line-clamp-2 text-xl font-bold leading-tight transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {post.description}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex min-h-7 flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border/70 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {post.authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{post.authorName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.publishDate).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                {t("read_more")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </article>
  );
}
