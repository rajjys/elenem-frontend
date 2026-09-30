import { cache } from 'react';
import { siteGet, type PublicSite } from './api';

/**
 * The site frame, once per request: the layout, its metadata and the page all ask for it, and
 * React's `cache` makes that one call instead of three.
 */
export const getSite = cache((slug: string) => siteGet<PublicSite>(slug));
