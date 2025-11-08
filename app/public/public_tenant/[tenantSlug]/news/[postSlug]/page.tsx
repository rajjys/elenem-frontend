"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { PostResponseDto } from "@/schemas";
import { LexicalRenderer, LoadingSpinner } from "@/components/ui";
import { toast } from "sonner";
import Image from "next/image";
import { Calendar, User, Building2 } from "lucide-react";
import axios from "axios";

/* ----------------------------------------------------------
 * Helper Components & Utils
 * ---------------------------------------------------------- */

const TenantBadge = ({ post }: { post: PostResponseDto }) => (
  <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl shadow-inner">
    {post.tenant?.businessProfile?.logoAsset?.url ? (
      <Image
        src={post.tenant.businessProfile.logoAsset.url}
        alt={`${post.tenant.name} Logo`}
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    ) : (
      <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
    )}
    <div>
      <p className="font-semibold text-xs text-gray-600 dark:text-gray-400">
        Published by
      </p>
      <p className="text-md font-bold text-indigo-700 dark:text-indigo-300">
        {post.tenant?.name || "Unknown Organization"}
      </p>
    </div>
  </div>
);

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* ----------------------------------------------------------
 * API
 * ---------------------------------------------------------- */

const fetchPublicPost = async (
  tenantSlug: string,
  postSlug: string
): Promise<PostResponseDto> => {
  const response = await api.get<PostResponseDto>(
    `/public-posts/${tenantSlug}/${postSlug}`
  );
  return response.data;
};

/* ----------------------------------------------------------
 * Page Component
 * ---------------------------------------------------------- */

export default function PublicPostPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postSlug: string }>
}) {
  const router = useRouter();
  const { tenantSlug, postSlug } = use(params);

  const [postData, setPostData] = useState<PostResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const data = await fetchPublicPost(tenantSlug, postSlug);
        setPostData(data);
      } catch (error) {
        let message = "Unexpected error occurred.";
        if (axios.isAxiosError(error)) {
          message =
            error.response?.status === 404
              ? "Post not found or not published."
              : "Failed to load post.";
        }
        toast.error(message);
        setPostData(null);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [tenantSlug, postSlug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner message="Loading blog post..." />
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="max-w-3xl mx-auto my-24 p-10 text-center bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-extrabold text-red-600 dark:text-red-400 mb-4">
          404 - Post Not Found
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          We could not find the blog post you were looking for. It may have been
          removed or the address is incorrect.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Hero Image */}
      {postData.heroImage?.url && (
        <div className="relative w-full h-80 sm:h-96 overflow-hidden">
          <Image
            src={postData.heroImage.url}
            alt={postData.title}
            fill
            style={{ objectFit: "cover" }}
            priority
            className="shadow-lg"
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-20 relative z-10">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            {postData.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
            <TenantBadge post={postData} />

            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{formatDate(postData.publishedAt || postData.createdAt)}</span>
            </div>

            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 text-indigo-500" />
              <span>{postData.createdBy?.username || "System Author"}</span>
            </div>
          </div>

          {postData.excerpt && (
            <p className="text-lg text-gray-600 dark:text-gray-300 italic">
              {postData.excerpt}
            </p>
          )}
        </div>

        {/* Lexical Renderer */}
        <div className="mt-8 prose dark:prose-invert max-w-none">
          <LexicalRenderer richContent={postData.richContent} />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          <p>This post is brought to you by {postData.tenant?.name}.</p>
        </div>
      </div>
    </article>
  );
}
