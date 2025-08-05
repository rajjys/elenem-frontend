// app/(public)/page.tsx
'use client';
import StatusCard from "@/components/ui/statusCard";
import StatusViewer from "@/components/ui/StatusViewer";
import BlogPostCard from "@/components/ui/BlogPostCard"; // Import the new component
import { useEffect, useState } from "react";
import { mockUsers, mockStatuses } from '@/data/mockStatuses'; // Assuming mockStatuses.js is in data/
import { mockBlogPosts, BlogPost } from '@/data/mockBlogPosts'; // Import blog posts

export default function HomePage() {
  // Environment variables are accessed on the server-side for `process.env`.
  // If you need them client-side in Next.js, they should be prefixed with NEXT_PUBLIC_
  // For this example, we'll hardcode or mock these for client-side usage.
  // In a real app, ensure these are handled securely.
  //const ROOT_DOMAIN = 'lvh.me:3000'; // Or 'website.com'
  //const handler = 'http://'; // Or 'https://'

  type StatusUser = {
    id: string;
    username: string;
    profileImageUrl: string;
  };

  type StatusMedia = {
    id: string;
    type: 'image' | 'video';
    url: string;
    timestamp: string;
  };

  type CombinedStatus = {
    user: StatusUser;
    media: StatusMedia[];
    latestMedia: StatusMedia;
  };

  const [selectedStatus, setSelectedStatus] = useState<CombinedStatus | null>(null);
  const [statusesToDisplay, setStatusesToDisplay] = useState<CombinedStatus[]>([]);
  const [displayedBlogPosts, setDisplayedBlogPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    // Combine mock users and statuses for easier rendering
    const combinedStatuses = mockStatuses
      .map((userStatus) => {
        const user = mockUsers.find((u) => u.id === userStatus.userId);
        if (!user) return null;

        const sortedMedia = [...userStatus.media].sort(
          (a, b) => (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );

        // Ensure the user object matches the StatusViewerProps type (profileImageUrl -> profilePic, username -> name)
        // This is a crucial mapping to fix the previous type error.
        const mappedUser = {
          id: user.id,
          username: user.username, // Map username to name
          profileImageUrl: user.profileImageUrl, // Map profileImageUrl to profilePic
        };

        return {
          user: mappedUser,
          media: sortedMedia,
          latestMedia: sortedMedia[sortedMedia.length - 1],
        };
      })
      .filter((status): status is CombinedStatus => status !== null);

    setStatusesToDisplay(combinedStatuses);

    // Initial load of blog posts
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    setDisplayedBlogPosts(mockBlogPosts.slice(startIndex, endIndex));

  }, [currentPage]); // Re-run effect when currentPage changes

  const handleStatusCardClick = (status: CombinedStatus) => {
    setSelectedStatus(status);
  };

  const handleCloseViewer = () => {
    setSelectedStatus(null);
  };

  // Pagination handlers for blog posts
  const handleNextPage = () => {
    if (currentPage * postsPerPage < mockBlogPosts.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      {/** Stories Section */}
      <div className="max-w-2xl mx-auto border-b border-gray-300 mb-4 pb-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Stories</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {statusesToDisplay.map((status) => (
            <StatusCard
              key={status.user.id}
              user={status.user}
              latestMedia={status.latestMedia}
              onClick={() => handleStatusCardClick(status)}
            />
          ))}
        </div>

        {selectedStatus && (
          <StatusViewer
            user={selectedStatus.user}
            media={selectedStatus.media}
            onClose={handleCloseViewer}
          />
        )}
      </div>

      {/** Blog Posts Section */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900">A La Une</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {displayedBlogPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-8 gap-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Previous
          </button>
          <span className="text-lg font-medium text-gray-700">Page {currentPage}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage * postsPerPage >= mockBlogPosts.length}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}