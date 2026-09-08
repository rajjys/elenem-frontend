'use client';

import { PostsListView } from '@/components/post';

/** The organisation's publications. */
export default function TenantPostsPage() {
  return <PostsListView scope="tenant" />;
}
