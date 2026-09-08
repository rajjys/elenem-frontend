'use client';

import { PostsListView } from '@/components/post';

/** Every publication on the platform. The operator has no organisation of their own to scope to. */
export default function AdminPostsPage() {
  return <PostsListView scope="platform" />;
}
