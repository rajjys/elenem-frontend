'use client'; // Mark as Client Component since we're using hooks

import { useRouter } from 'next/navigation';

interface AccessDeniedPageProps {
  errorMessage?: string;
}

const AccessDeniedPage = ({ errorMessage }: AccessDeniedPageProps) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Warning icon */}
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              {errorMessage || `You don't have permission to access this page. If you believe this is an error, please contact your administrator.`}
            </p>
            
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a 
              href="mailto:support@yourdomain.com" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;