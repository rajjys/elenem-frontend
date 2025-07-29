// app/(public)/page.tsx

// Mock data for leagues (in a real app, this would come from an API or database)
const leagues = [
  { id: 'ligue1', name: 'Ligue 1', description: 'Top French Football League' },
  { id: 'premierleague', name: 'Premier League', description: 'Top English Football League' },
  { id: 'laliga', name: 'La Liga', description: 'Top Spanish Football League' },
];

export default function HomePage() {
  const ROOT_DOMAIN = (process.env.NODE_ENV === 'development' ) ? 'lvh.me' : "website.com";
  // Function to handle redirection to a specific league's subdomain
  const redirectToLeague = (leagueSlug: string) => {
    console.log("The Slug: ", leagueSlug);
    // Construct the full subdomain URL
    // Ensure this matches your actual domain
    const leagueUrl = `http://${leagueSlug}.${ROOT_DOMAIN}:3000`;
    console.log(leagueUrl);
    window.location.href = leagueUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl text-center">
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
