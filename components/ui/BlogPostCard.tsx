import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/data/mockBlogPosts'; // Adjust path if necessary

type BlogPostCardProps = {
  post: BlogPost;
};

const BlogPostCard = ({ post }: BlogPostCardProps) => {
  return (
    <Link href={`/news/${post.slug}`} className="block">
      <div className="bg-white rounded-sm shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 my-2 md:my-4">
        <div className="relative w-full h-42">
          <Image
            src={post.imageUrl}
            alt={post.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">
            {post.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {post.content}
          </p>
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>By {post.author}</span>
            <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;