// components/StatusViewer.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

// Corrected type definitions to match the usage in the component and mock data
type User = {
  id: string;
  username: string; // Changed from 'username' to 'name' to match mock data
  profileImageUrl: string; // Changed from 'profileImageUrl' to 'profilePic' to match mock data
};

type MediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp?: string; // Optional, as not always directly used in Viewer, but good to have
};

type StatusViewerProps = {
  user: User;
  media: MediaItem[];
  onClose: () => void;
};

const StatusViewer = ({ user, media, onClose }: StatusViewerProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null); // Explicitly type useRef for timer

  // Ensure currentMedia is always defined before accessing its properties
  const currentMedia = media[currentMediaIndex];

  const goToNextMedia = useCallback(() => {
    if (currentMediaIndex < media.length - 1) {
      setCurrentMediaIndex((prev) => prev + 1);
    } else {
      onClose(); // Close viewer if it's the last media
    }
  }, [currentMediaIndex, media.length, onClose]);

  const goToPreviousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    // Auto-advance to the next media after a few seconds (e.g., 5 seconds)
    if (currentMedia) {
      // Clear any existing timer to prevent multiple timers running
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(goToNextMedia, 5000); // Adjust duration as needed
    }

    // Clean up timer on unmount or when currentMediaIndex/media changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentMediaIndex, media, currentMedia, goToNextMedia]); // Added currentMedia and goToNextMedia to dependencies

  // If there's no media or user, don't render the viewer
  if (!user || !media || media.length === 0) {
    return null;
  }

  // If for some reason currentMedia is undefined (e.g., index out of bounds), return null
  if (!currentMedia) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {media.map((_, index) => (
          <div
            key={index} // Consider using a more stable key if media items had unique IDs
            className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-500 ease-linear ${ index < currentMediaIndex ? 'w-full' : index === currentMediaIndex ? 'w-0 animate-progress' : 'w-0'}`}
              style={
                index === currentMediaIndex
                  ? { animationDuration: '5s' }
                  : {} // Apply animation duration only to the current progress bar
              }>
            </div>
          </div>
        ))}
      </div>

      {/* Close button - changed from <Button> to <button> as there was no Button component imported/defined */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl z-10"
      >
        &times;
      </button>

      {/* User Info */}
      <div className="absolute top-12 left-4 flex items-center gap-2 z-10">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
          {/* Using user.profilePic and user.name as defined in the corrected User type */}
          <Image
            src={user.profileImageUrl}
            alt={`${user.username}'s profile`}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <span className="text-white font-semibold">{user.username}</span>
        {/* You can add timestamp here as well */}
      </div>

      {/* Media display */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentMedia.type === 'image' && (
          <Image
            src={currentMedia.url}
            alt={`Status by ${user.username}`}
            width={720} // Adjust based on common aspect ratios for stories
            height={1280} // Common story aspect ratio (9:16)
            objectFit="contain" // Contain to ensure full image is visible
            className="max-w-full max-h-full"
          />
        )}
        {currentMedia.type === 'video' && (
          <video
            key={currentMedia.id} // Key change forces remount and restart of video
            src={currentMedia.url}
            className="max-w-full max-h-full object-contain"
            controls
            autoPlay
            onEnded={goToNextMedia} // Advance when video ends
          />
        )}

        {/* Navigation arrows */}
        <button
          onClick={goToPreviousMedia}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-4 text-white text-4xl bg-black bg-opacity-30 rounded-r-lg"
        >
          &lt;
        </button>
        <button
          onClick={goToNextMedia}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-white text-4xl bg-black bg-opacity-30 rounded-l-lg"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default StatusViewer;