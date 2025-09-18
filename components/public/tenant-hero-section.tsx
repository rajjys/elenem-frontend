'use client';
import { BlogPost } from '@/schemas';
import Link from 'next/link';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TenantHeroSectionProps {
  blogPosts: BlogPost[];
  primaryColor: string;
  secondaryColor: string;
}

const TenantHeroSection: React.FC<TenantHeroSectionProps> = ({ primaryColor, secondaryColor, blogPosts }) => {
  // State to track the current index of the displayed blog post
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  // State to handle the progress of the current timer
  const [progress, setProgress] = useState(0);

  // Refs to manage the carousel and animation timers
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Duration for each slide (6 seconds)
  const duration = 6000;

  // The core animation function
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    const elapsedTime = timestamp - startTimeRef.current;
    const newProgress = Math.min(100, (elapsedTime / duration) * 100);
    setProgress(newProgress);

    if (newProgress < 100) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Effect to manage the carousel timer and progress bar animation
  useEffect(() => {
    if (blogPosts.length > 0) {
      // Clear any old interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Clear any old animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Reset progress and start animation
      setProgress(0);
      startTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animate);

      // Start a new interval to change the post index
      intervalRef.current = setInterval(() => {
        setCurrentPostIndex(prevIndex => (prevIndex + 1) % blogPosts.length);
      }, duration);
    }
  }, [animate, blogPosts.length, currentPostIndex]);

  // Handler for manual clicks on progress bars
  const handlePostChange = (index: number) => {
    // Clear the current interval to prevent it from immediately overriding the manual change
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Set the new post index. This will trigger the useEffect above to restart the carousel.
    setCurrentPostIndex(index);
  };

  // Handle cases where no blog posts are found
  if (blogPosts.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">
          Aucun article de blog trouvé pour ce locataire.
        </p>
      </div>
    );
  }

  // Get the current blog post
  const currentPost = blogPosts[currentPostIndex];

  return (
    <div className="relative h-[50vh] md:h-[90vh] lg:h-[92vh] w-full overflow-hidden">
      {/* Background image with overlay and smooth transition */}
      <div
        className="absolute inset-0 z-0 h-full w-full transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${currentPost?.heroImage?.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark inset overlay from bottom to top */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-${primaryColor}-900 via-transparent to-transparent`}
        />
      </div>

      {/* Content for medium and larger screens (overlay) */}
      <div className="relative z-10 hidden h-full w-full flex-col justify-end p-8 md:flex">
        <div className="mb-8 max-w-4xl transition-all duration-500 ease-in-out">
          <Link href={`/news/${currentPost?.slug}`}>
            <h1 className="text-5xl font-bold text-white transition-all duration-500 ease-in-out hover:text-gray-300">
              {currentPost?.title}
            </h1>
          </Link>
          <Link href={`/news/${currentPost?.slug}`}>
            <button
              className={`mt-4 rounded-full px-8 py-3 font-semibold text-white transition-all duration-300 ease-in-out border-2 border-${secondaryColor}-400 hover:border-${secondaryColor}-200 cursor-pointer`}
            >
              Lire Plus
            </button>
          </Link>
        </div>

        {/* Progress bars for medium and larger screens */}
        <div className="flex w-full max-w-4xl items-start justify-between space-x-4">
          {blogPosts.map((post, index) => (
            <div key={post.id} className="group space-x-2">
              <div className="h-1 flex-grow cursor-pointer rounded-full bg-gray-500/50">
                <div
                  className={`h-full rounded-full bg-${secondaryColor}-400 transition-all duration-200 ease-in-out`}
                  style={{
                    width: index === currentPostIndex ? `${Math.trunc(progress)}%` : '0%',
                  }}
                  onClick={() => handlePostChange(index)}
                />
              </div>
              <p
                className={`w-32 cursor-pointer text-sm  transition-colors duration-300 ease-in-out group-hover:text-white ${
                  index === currentPostIndex ? 'text-white font-bold' : 'text-gray-300 font-medium'
                }`}
                onClick={() => handlePostChange(index)}
              >
                {post.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Content for small screens (below image) */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between md:hidden">
        {/* Image takes up 60% of the height */}
        <div
            className="relative h-4/5 w-full transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${currentPost?.heroImage?.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Bottom-only gradient overlay */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-${primaryColor}-900 to-transparent`}
            />
          </div>
        {/* Text content below the image */}
        <div className={`flex h-1/5 flex-col z-12 justify-end bg-${primaryColor}-900 p-4 transition-all duration-500 ease-in-out`}>
          <Link href={`/news/${currentPost?.slug}`}>
            <h2 className="text-3xl font-bold text-white transition-all duration-500 ease-in-out hover:text-gray-300">
              {currentPost?.title}
            </h2>
          </Link>
          {/* Progress bars for small screens (no titles) */}
          <div className="mt-4 flex w-full items-center justify-between space-x-2">
            {blogPosts.map((post, index) => (
              <div
                key={post.id}
                className="group flex flex-grow items-center"
                onClick={() => handlePostChange(index)}
              >
                <div
                  className={`h-1 flex-grow cursor-pointer rounded-full bg-gray-500/50`}
                >
                  <div
                    className={`h-full rounded-full bg-${secondaryColor}-400 transition-all duration-100 ease-in-out`}
                    style={{
                      width: index === currentPostIndex ? `${progress}%` : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TenantHeroSection;