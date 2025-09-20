// app/(auth)/health/HealthClientPage.tsx

'use client'; // This directive marks the component as a Client Component

import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { api } from '@/services/api'; // Assuming you have an 'api' service configured (e.g., Axios instance)
                                       // that points to your NestJS backend URL.
import { CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react'; // Example icons from lucide-react

export default function HealthClientPage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Attempting to connect to the backend...');

  // Wrap checkHealth in useCallback to ensure it's stable across re-renders.
  // This is good practice when a function is a dependency of useEffect.
  const checkHealth = useCallback(async () => {
    setStatus('loading'); // Set status to loading at the start of the check/retry
    setMessage('Connecting to backend...');
    try {
      const response = await api.get('/auth/health'); // Your API call
      if (response.data && response.data.status === 'OK') {
        setStatus('ok');
        setMessage('Backend is connected and healthy!');
      } else {
        setStatus('error');
        setMessage('Backend health check failed: Unexpected response.');
      }
    } catch (err) {
      setStatus('error');
      // Provide a more informative error message for cold starts
      const errorMessage = (err as Error).message || 'Network error or backend is unreachable.';
      setMessage(`Backend connection error: ${errorMessage}. It might be currently warming up.`);
      console.error("Backend health check failed:", err);
    }
  }, []); // Empty dependency array ensures checkHealth itself doesn't change on re-renders

  useEffect(() => {
    checkHealth(); // Initial health check on component mount
  }, [checkHealth]); // Depend on checkHealth. Since checkHealth is wrapped in useCallback with [] deps, this effect runs only once.

  const getStatusIcon = () => {
    switch (status) {
      case 'ok':
        return <CheckCircleIcon className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-12 h-12 text-red-500" />;
      case 'loading':
      default:
        // Use animate-pulse for a fading effect or animate-spin for a classic spinner
        return <ClockIcon className="w-12 h-12 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'ok': return 'text-green-700';
      case 'error': return 'text-red-700';
      case 'loading': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm text-center">
        <div className="mb-4 flex justify-center">
          {getStatusIcon()}
        </div>
        <h1 className={`text-2xl font-bold ${getStatusTextColor()} mb-2`}>
          Backend Health Check
        </h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {status === 'loading' && (
            <p className="text-sm text-gray-500">
                (Free-tier backends often have a cold start delay. Please wait up to 30 seconds for the first connection.)
            </p>
        )}
        {status === 'error' && (
            <button
                onClick={checkHealth} // Corrected: Directly call the checkHealth function
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
                Retry
            </button>
        )}
      </div>
    </div>
  );
}