'use client';

import { PostsListView } from '@/components/post';

/** The club's publications. Same broken redirect as the competition's, same fix. */
export default function TeamPostsPage() {
  return <PostsListView scope="team" />;
}
