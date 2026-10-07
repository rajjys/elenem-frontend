'use client';
import { EntityImage } from '@/components/media/entity-image';

/**
 * An account's picture in a 40 px circle, or its initials. It used to fall back to an image from placehold.co —
 * one more request to a third party on every row without a logo — and went through next/image,
 * which refuses the development bucket's host.
 */
function UserAvatar({ src, alt, fallbackText }: { src?: string | null; alt: string; fallbackText: string }) {
  return <EntityImage url={src} name={alt || fallbackText} size={40} kind="photo" />;
}
export default UserAvatar;
