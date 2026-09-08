'use client';

import { PostsListView } from '@/components/post';

/**
 * The competition's publications.
 *
 * `/post/create` has redirected here on success since it was written, and until Phase 4 this route
 * rendered « En developpement. Revenez plus tard » — so a league administrator who published a post
 * was told the feature did not exist, immediately after using it.
 */
export default function LeaguePostsPage() {
  return <PostsListView scope="league" />;
}
