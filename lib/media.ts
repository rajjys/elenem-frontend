/**
 * Images as the API stores them (docs/IMAGES_AND_STORAGE.md §4).
 *
 * Every image is a square stored at three sizes beside each other —
 * `…/t/<organisation>/<slot>/<asset>/{sm,md,lg}.webp`, and `md.png` for logos — and an entity's
 * URL column points at `md.webp`. Mirrors backend `src/media/image-slots.ts`.
 */

export type ImageSlot = 'tenant-logo' | 'league-logo' | 'team-logo' | 'player-photo';

/** `sm` 128 px for lists, `md` 512 px for pages, `lg` 1024 px kept for later. Each is a ceiling. */
export type ImageSize = 'sm' | 'md' | 'lg';

/** A logo is fitted whole into its square; a photo fills it. */
export type ImageKind = 'logo' | 'photo';

export const SLOT_KIND: Record<ImageSlot, ImageKind> = {
  'tenant-logo': 'logo',
  'league-logo': 'logo',
  'team-logo': 'logo',
  'player-photo': 'photo',
};

/** The smallest square side the API accepts. */
export const MIN_SIDE = 128;

const OURS = /^(.*\/t\/[^/]+\/[a-z-]+\/[^/]+\/)md\.webp$/;

/**
 * The address of one size of an image the API stored. Any other URL comes back unchanged, so a
 * caller never has to know where an image came from.
 */
export function mediaSrc(
  url: string | null | undefined,
  size: ImageSize = 'md',
  format: 'webp' | 'png' = 'webp',
): string | null {
  if (!url) return null;
  const match = OURS.exec(url);
  return match ? `${match[1]}${size}.${format}` : url;
}
