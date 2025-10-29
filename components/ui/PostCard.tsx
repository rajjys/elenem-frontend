// src/components/PostCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui";
import { PostResponseDto } from "@/schemas";
import Image from "next/image";
import Link from "next/link";

interface PostCardProps {
  post: PostResponseDto;
  href: string;
  onDelete?: () => void;
}

export function PostCard({ post, href, onDelete }: PostCardProps) {
  return (
    <Link href={href}>
      <Card className="flex items-center space-x-4 hover:shadow-md transition my-2">
        {post.heroImage?.url && (
          <div className="relative w-40 h-28 flex-shrink-0">
            <Image
              src={post.heroImage.url}
              alt={post.title || "Post image"}
              fill
              className="object-cover rounded-l"
            />
          </div>
        )}
        <CardContent className="flex flex-col justify-center p-4">
          <h3 className="text-lg font-semibold">{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.excerpt || post.content.slice(0, 120) + "..."}
          </p>
          <span className="text-xs text-muted-foreground mt-2">
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
