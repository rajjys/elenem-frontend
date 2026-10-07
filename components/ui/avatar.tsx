'use client';
import React from 'react';
import { EntityImage } from '@/components/media/entity-image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number; // px, default 60
  className?: string;
}

/** A club's crest or an organisation's logo in a circle, or its initials (components/media). */
export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 60, className = '' }) => (
  <EntityImage url={src} name={name} size={size} className={className} />
);
