"use client";

import React, { useState } from 'react';
// Direct file-upload page: raw axios is intentional for presigned-PUT-to-S3 /
// multipart uploads with progress, which must NOT go through the JSON api client.
// eslint-disable-next-line no-restricted-imports
import axios from 'axios';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui buttons
import { Input } from '@/components/ui/input'; // Assuming shadcn/ui input
import { Progress } from '@/components/ui/progress'; // Assuming shadcn/ui progress
import { toast } from 'sonner';

// Note: You will need to install axios if you don't have it already:
// npm install axios

// This component is a standalone page to test the backend upload endpoints.
// You can drop this into a file like app/upload-test/page.tsx

export default function FileUploadTester() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The base URL for your NestJS backend.
  // Use a development URL for local testing.
  const API_BASE_URL = 'http://localhost:3333';

  // Handles the file selection from the input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Reset state when a new file is selected
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadedUrl(null);
    setErrorMessage(null);

    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  // Handles the upload process
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Determine the correct endpoint based on file type
    const isVideo = selectedFile.type.startsWith('video/');
    const endpoint = isVideo ? '/upload/video' : '/upload/file';

    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // If your upload endpoint is protected, you would add an Authorization header here:
          // 'Authorization': `Bearer ${yourAuthToken}`
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      // Assuming your backend returns a JSON object with a 'url' field
      if (response.data && response.data.url) {
        setUploadedUrl(response.data.url);
        setUploadStatus('success');
      } else {
        setErrorMessage('Upload succeeded, but no URL was returned.');
        setUploadStatus('error');
      }

    } catch (error) {
      setUploadStatus('error');
      // Axios error handling
      if (axios.isAxiosError(error) && error.response) {
        console.error('Upload failed with server response:', error.response.data);
        setErrorMessage(error.response.data.message || 'An unexpected error occurred during upload.');
      } else {
        console.error('Upload failed:', error);
        setErrorMessage('An unexpected error occurred.');
      }
      toast.error(errorMessage)
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-sunk p-4">
      <div className="w-full max-w-2xl bg-surface p-8 rounded-xl shadow-lg border">
        <h1 className="text-3xl font-bold text-center mb-6 text-ink">Media Upload Tester</h1>
        <p className="text-center text-sm text-ink-muted mb-8">
          Select an image or video to test your NestJS upload endpoints.
        </p>

        <div className="flex flex-col space-y-4">
          <Input 
            type="file" 
            onChange={handleFileChange} 
            className="file:text-accent-text file:bg-accent-soft file:border-0 file:rounded-md file:py-2 file:px-4"
          />

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || uploadStatus === 'uploading'}
            className="w-full"
          >
            {uploadStatus === 'uploading' ? `Uploading... (${uploadProgress}%)` : 'Upload File'}
          </Button>

          {uploadStatus === 'uploading' && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {uploadStatus === 'success' && uploadedUrl && (
            <div className="mt-4 p-4 rounded-md bg-positive-soft border border-positive text-positive">
              <p className="font-semibold">Upload successful!</p>
              <p className="text-sm break-all">
                URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">{uploadedUrl}</a>
              </p>
            </div>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <div className="mt-4 p-4 rounded-md bg-negative-soft border border-negative text-negative">
              <p className="font-semibold">Upload failed.</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {selectedFile && uploadStatus === 'idle' && (
            <div className="mt-4 p-4 rounded-md bg-accent-soft border border-accent-line text-accent-text">
              <p className="font-semibold">File selected:</p>
              <p className="text-sm">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
