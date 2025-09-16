"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PostCard } from "@/components/ui";
import { PostResponseDto } from "@/schemas";
import Head from "next/head";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function TenantPostsPage() {
  const [posts, setPosts] = useState<PostResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await api.get("/posts", {
          params: { pageSize: 10 },
        });
        setPosts(res.data.data); // backend returns { data, totalItems, ... }
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!posts.length) return <p>No posts available.</p>;

  return (
    <div className="min-h-screen">
        <Head>
            <title>Tenant Dashboard - ELENEM Sports</title>
        </Head>
        <section className='flex items-center justify-between'>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Organisation:</h1>
            <div className='flex whitespace-nowrap text-sm gap-3'>
                <Link href='/post/create' className="w-full flex items-center justify-center bg-emerald-600 text-white py-2 px-2 rounded-md hover:bg-emerald-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" /> Creer un Article
                </Link>
            </div>
        </section>
        <section className="">
            {posts.map((post) => (
                <PostCard
                key={post.id}
                post={post}
                href={`/tenant/posts/${post.slug}`}
                />
            ))}
        </section>
      
    </div>
  );
}
