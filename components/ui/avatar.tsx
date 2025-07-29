'use client';
import React, { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number; // px, default 60
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 60,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  // Get two-letter initials from name
  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";

  if (!imgError && src) {
    return (
      <Image
        src={src}
        alt={name}
        height={size}
        width={size}
        className={`object-cover rounded-full border border-gray-200 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-gray-200 pt-1 px-2 bg-emerald-100 text-emerald-700 font-bold select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};