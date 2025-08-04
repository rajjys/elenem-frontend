// app/(public)/page.tsx
'use client';
import StatusCard from "@/components/ui/statusCard";
import StatusViewer from "@/components/ui/StatusViewer";
import { useEffect, useState } from "react";

 // This component needs to be a Client Component for useRouter

// Mock data for leagues (in a real app, this would come from an API or database)
const leagues = [
  { id: 'ligue1', name: 'Ligue 1', description: 'Top French Football League' },
  { id: 'premierleague', name: 'Premier League', description: 'Top English Football League' },
  { id: 'laliga', name: 'La Liga', description: 'Top Spanish Football League' },
];
// data/mockStatuses.js
export const mockUsers = [
  {
    id: 'user1',
    username: 'Alice',
    profileImageUrl: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/cmdwuqbdyre6307w3r9exg754', // Example profile pic
  },
  {
    id: 'user2',
    username: 'Bob',
    profileImageUrl: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/cmdwuqbdmre5t07w3fzlu15qn',
  },
  {
    id: 'user3',
    username: 'Charlie',
    profileImageUrl: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/cmdwuqbdtre5y07w3pxr955fv',
  },
];

export const mockStatuses = [
  {
    userId: 'user1',
    media: [
      {
        id: 'status1_1',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/TMCAKiy8SVKBR59s8Ijw',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      },
      {
        id: 'status1_2',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/h9qDcx9QFmmxhxgCNOGw',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
      },
    ],
  },
  {
    userId: 'user2',
    media: [
      {
        id: 'status2_1',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/aD8H02eT5KhojWgSFoTn', // Example video URL
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
      },
    ],
  },
  {
    userId: 'user3',
    media: [
      {
        id: 'status3_1',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/KaO9mtvmRTyVtR1UGmEw',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'status3_2',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/UX6Zz3KTKjHwjZ4ONjRg',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        id: 'status3_3',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/eoj1KnPsSY6mpvfxKwVi',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
    ],
  },
];



export default function HomePage() {
  const ROOT_DOMAIN = (process.env.NODE_ENV === 'development' ) ? 'lvh.me:3000' : "website.com";
  const handler = (process.env.NODE_ENV === 'development' ) ? 'http://' : 'https://';
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

  const [selectedStatus, setSelectedStatus] = useState<CombinedStatus | null>(null); // { user, media }
  const [statusesToDisplay, setStatusesToDisplay] = useState<CombinedStatus[]>([]);

  useEffect(() => {
    // Combine mock users and statuses for easier rendering
    const combinedStatuses = mockStatuses
      .map((userStatus) => {
        const user = mockUsers.find((u) => u.id === userStatus.userId);
        if (!user) return null; // Skip if user not found

        // Sort media by timestamp to ensure correct order
        const sortedMedia = [...userStatus.media].sort(
          (a, b) => (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );

        return {
          user,
          media: sortedMedia,
          latestMedia: sortedMedia[sortedMedia.length - 1], // Get the last posted media for the card
        };
      })
      .filter((status): status is CombinedStatus => status !== null); // Remove any null entries with type guard

    setStatusesToDisplay(combinedStatuses);
  }, []);

  const handleStatusCardClick = (status: CombinedStatus) => {
    setSelectedStatus(status);
  };

  const handleCloseViewer = () => {
    setSelectedStatus(null);
  };
  // Function to handle redirection to a specific league's subdomain
  const redirectToLeague = (leagueSlug: string) => {
    console.log("The Slug: ", leagueSlug);
    // Construct the full subdomain URL
    // Ensure this matches your actual domain
    const leagueUrl = `${handler}${leagueSlug}.${ROOT_DOMAIN}`;
    console.log(leagueUrl);
    window.location.href = leagueUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      {/**Stories Section */}
      <div className="max-w-3xl mx-auto border-b border-gray-300 mb-4">
        <div className="flex gap-4 overflow-x-auto pb-4">
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
      <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-3xl text-center mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to Sport League Hub</h1>
        <p className="text-lg text-gray-700 mb-8">
          Explore various sports leagues, their games, standings, and teams.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Leagues</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => redirectToLeague(league.id)} // Click handler for redirection
            >
              <h3 className="text-xl font-bold text-blue-700 mb-2">{league.name}</h3>
              <p className="text-gray-600">{league.description}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                View League
              </button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-gray-500 text-sm">
          Click on a league to visit its dedicated public page.
        </p>
      </div>
    </div>
  );
}
