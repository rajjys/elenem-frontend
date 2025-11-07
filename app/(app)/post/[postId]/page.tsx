"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PostForm } from '@/components/forms';
import { api } from '@/services/api';
import { PostResponseDto, Roles } from '@/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui'; // Assuming you have this
import { useAuthStore } from '@/store/auth.store'; // To model the redirect path
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function PostEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.postId as string;

  // State management modeled after GameManagementDashboard
  const [postData, setPostData] = useState<PostResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth logic modeled after GameManagementDashboard
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  // Define the redirect path for success/cancel
  const redirectPath = isSystemAdmin ? "/admin/posts":
                       isTenantAdmin ? "/tenant/posts" :
                       isLeagueAdmin ? "/league/posts" :
                       "/team/posts"; // Assuming Team Admin path

  // Effect to fetch post data on load
  useEffect(() => {
    if (!postId) {
      toast.error("Invalid Post ID.");
      router.push(redirectPath); // Use role-based redirect
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<PostResponseDto>(`/posts/${postId}`);
        console.log("Fetched post data:", response.data);
        setPostData(response.data);
      } catch (error) {
        const errorMessage = 'Failed to load post details.';
        toast.error(errorMessage);
        console.error(error);
        setError(errorMessage);
        router.push(redirectPath); // Redirect on failure
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, router, redirectPath]);

  // Callbacks for the PostForm
  const handleSuccess = () => {
    toast.success("Post updated successfully!");
    // Navigate back to the main post list for the user's role
    router.push(redirectPath);
  };

  const handleCancel = () => {
    // Navigate back
    router.push(redirectPath);
  };

  // Loading state (modeled after GameManagementDashboard)
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner message="Loading post..." />
      </div>
    );
  }

  // Error state
  if (error || !postData) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 text-center text-red-600 border border-red-300 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error Loading Post</h2>
        <p>{error || "The post data could not be found."}</p>
        <Button onClick={handleCancel} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Success state: Render the form with initialData
  return (
    <div className="max-w-4xl mx-auto my-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Post: {postData.title}</CardTitle>
          <p className="text-sm text-gray-500">Post ID: {postId}</p>
        </CardHeader>
        <CardContent>
          <PostForm
            initialData={postData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}