import { BlogPost } from '@/schemas';
import Image from 'next/image';
import Link from 'next/link';

type BlogPostCardProps = {
  post: BlogPost;
  themeColor?: string;
};

const BlogPostCard = ({ post, themeColor="orange" }: BlogPostCardProps) => {
  return (
    <Link href={`/news/${post.slug}`} className="block w-full aspect-[9/14] relative rounded-md overflow-hidden group">
      {/* Background Image */}
      <Image
        src={post.heroImage.url}
        alt={post.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority
      />

      {/* Dark Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-${themeColor}-900 via-transparent to-transparent group-hover:bg-opacity-60 transition-opacity duration-300`} />

      {/* Title Text */}
      <div className="absolute bottom-0 w-full p-4 text-white">
        <h3 className="text-lg md:text-xl font-bold leading-snug line-clamp-3">
          {post.title}
        </h3>
      </div>
    </Link>
  );
};

export default BlogPostCard;
