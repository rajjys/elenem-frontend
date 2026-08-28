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
        return <CheckCircleIcon className="w-12 h-12 text-positive" />;
      case 'error':
        return <XCircleIcon className="w-12 h-12 text-negative" />;
      case 'loading':
      default:
        // Use animate-pulse for a fading effect or animate-spin for a classic spinner
        return <ClockIcon className="w-12 h-12 text-accent-text animate-pulse" />;
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'ok': return 'text-positive';
      case 'error': return 'text-negative';
      case 'loading': return 'text-accent-text';
      default: return 'text-ink';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunk p-4">
      <div className="bg-surface p-8 rounded-lg shadow-lg w-full max-w-sm text-center">
        <div className="mb-4 flex justify-center">
          {getStatusIcon()}
        </div>
        <h1 className={`text-2xl font-bold ${getStatusTextColor()} mb-2`}>
          Backend Health Check
        </h1>
        <p className="text-ink-muted mb-4">{message}</p>
        {status === 'loading' && (
            <p className="text-sm text-ink-muted">
                (Free-tier backends often have a cold start delay. Please wait up to 30 seconds for the first connection.)
            </p>
        )}
        {status === 'error' && (
            <button
                onClick={checkHealth} // Corrected: Directly call the checkHealth function
                className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
            >
                Retry
            </button>
        )}
      </div>
    </div>
  );
}