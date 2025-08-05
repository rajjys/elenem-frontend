// app/(public)/news/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { mockBlogPosts } from '@/data/mockBlogPosts'; // Adjust path if necessary

// This component can be a Server Component as it fetches data at build time or request time
// For dynamic routes in App Router, params are passed to the component directly

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NewsPostPage({ params }: any) {
  const { slug } = params;

  // Find the current blog post based on the slug
  const post = mockBlogPosts.find((p) => p.slug === slug);

  // If no post is found, return a 404
  if (!post) {
    notFound();
  }

  // Find similar posts (e.g., from the same tenant, excluding the current post)
  const similarPosts = mockBlogPosts
    .filter((p) => p.tenantSlug === post.tenantSlug && p.id !== post.id)
    .sort(() => 0.5 - Math.random()) // Randomize similar posts
    .slice(0, 3); // Get up to 3 similar posts

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl mx-auto">
        {/* Blog Post Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <p className="text-gray-600 text-sm mb-2">
            By {post.author} on {new Date(post.date).toLocaleDateString('fr-FR')}
          </p>
          <div className="relative w-full h-96 rounded-lg overflow-hidden mb-6">
            <Image
              src={post.imageUrl}
              alt={post.title}
              layout="fill"
              objectFit="cover"
              priority // Prioritize loading for the main image
            />
          </div>
        </div>

        {/* Blog Post Content */}
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed mb-12">
          <p>{post.content}</p>
          {/* Add more paragraphs or rich content here */}
          <p>
            Ceci est un paragraphe supplémentaire pour illustrer un contenu plus long. Le football et le basketball continuent de captiver les masses dans la province du Kivu, avec des ligues locales qui gagnent en popularité et en visibilité. La passion pour le sport est un moteur puissant pour le développement communautaire.
          </p>
        </div>

        {/* Similar Posts Section */}
        {similarPosts.length > 0 && (
          <div className="mt-12 border-t pt-8 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Articles Similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarPosts.map((similarPost) => (
                <Link href={`/news/${similarPost.slug}`} key={similarPost.id} className="block">
                  <div className="bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                    <div className="relative w-full h-32">
                      <Image
                        src={similarPost.imageUrl}
                        alt={similarPost.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                        {similarPost.title}
                      </h3>
                      <p className="text-gray-600 text-xs">
                        By {similarPost.author}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to all news link */}
        <div className="mt-10 text-center">
          <Link href="/news" className="text-blue-600 hover:underline text-lg font-medium">
            &larr; Back to All News
          </Link>
        </div>
      </div>
    </div>
  );
}

// Optional: Generate static paths for SSG if you want
// export async function generateStaticParams() {
//   return mockBlogPosts.map((post) => ({
//     slug: post.slug,
//   }));
// }