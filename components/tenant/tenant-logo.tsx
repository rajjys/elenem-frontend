import Image from "next/image";
import React, { useState } from "react";
// ...existing code...

function TenantLogo({ src, alt, fallbackText }: { src?: string | null; alt: string; fallbackText: string }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <Image
        src={`https://placehold.co/40x40/cccccc/333333?text=${fallbackText}`}
        alt={alt}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
      onError={() => setImgError(true)}
      unoptimized
    />
  );
}
export default TenantLogo;