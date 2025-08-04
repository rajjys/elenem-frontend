// components/StatusCard.js
import Image from 'next/image';

type StatusCardProps = {
  user: {
    id: string,
    username: string,
    profileImageUrl: string
  }
   latestMedia: {
        id: string,
        type: 'image' | 'video',
        url: string,
    };
    onClick: () => void;
}
const StatusCard = ({ user, latestMedia, onClick } : StatusCardProps) => {
  if (!user || !latestMedia) return null; // Handle cases where data might be missing

  return (
    <div
      className="relative w-32 h-48 rounded-lg overflow-hidden cursor-pointer shadow-md flex-shrink-0"
      onClick={onClick}
    >
      {latestMedia.type === 'image' && (
        <Image
          src={latestMedia.url}
          alt={`Status by ${user.username}`}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
      )}
      {latestMedia.type === 'video' && (
        <video
          src={latestMedia.url}
          className="w-full h-full object-cover rounded-lg"
          muted // Mute for preview
          loop // Loop for preview
          //autoPlay // Autoplay for preview
        />
      )}
      <div className="absolute top-2 left-2 w-10 h-10 rounded-full overflow-hidden border-2 border-white z-10">
        <Image
          src={user.profileImageUrl || 'https://via.placeholder.com/300x500/FFC300/FFFFFF?text=USer+Story'}
          alt={`${user.username}'s profile`}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="absolute bottom-2 left-2 text-white text-sm font-semibold z-10">
        {user.username}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-800 to-gray-200 opacity-50 rounded-lg"></div> {/* Overlay for text readability */}
    </div>
  );
};

export default StatusCard;