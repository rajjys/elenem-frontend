"use client";

import React, { useState } from 'react';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Media Upload Tester</h1>
        <p className="text-center text-sm text-gray-500 mb-8">
          Select an image or video to test your NestJS upload endpoints.
        </p>

        <div className="flex flex-col space-y-4">
          <Input 
            type="file" 
            onChange={handleFileChange} 
            className="file:text-blue-500 file:bg-blue-50 file:border-0 file:rounded-md file:py-2 file:px-4"
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
            <div className="mt-4 p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
              <p className="font-semibold">Upload successful!</p>
              <p className="text-sm break-all">
                URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadedUrl}</a>
              </p>
            </div>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
              <p className="font-semibold">Upload failed.</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {selectedFile && uploadStatus === 'idle' && (
            <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-200 text-blue-800">
              <p className="font-semibold">File selected:</p>
              <p className="text-sm">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
