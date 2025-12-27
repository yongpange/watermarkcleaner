import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Tag, ArrowRight, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { LocalizedPostSummary } from "@/lib/blog";
import Image from "next/image";

interface BlogCardProps {
  post: LocalizedPostSummary;
  locale: string;
}

export default function BlogCard({ post, locale }: BlogCardProps) {
  return (
    <article className="group">
      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/10 overflow-hidden">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            {post.featured && (
              <Badge className="absolute top-4 left-4 bg-yellow-500 text-black hover:bg-yellow-500">
                Featured
              </Badge>
            )}
          </div>
        )}

        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {post.categoryName}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
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
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Author and Date */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <div className="flex items-center gap-3">
              {post.authorAvatar ? (
                <Image
                  src={post.authorAvatar}
                  alt={post.authorName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {post.authorName.charAt(0)}
                  </span>
                </div>
              )}
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
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Read More
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}