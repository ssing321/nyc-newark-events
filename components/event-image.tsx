"use client";

import Image from "next/image";
import { useState } from "react";

interface EventImageProps {
  src?: string;
  alt: string;
  category: string;
  priority?: boolean;
  sizes: string;
}

export function EventImage({ src, alt, category, priority = false, sizes }: EventImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="image-fallback" role="img" aria-label={`${alt} — image unavailable`}>
        <span>{category}</span>
        <strong aria-hidden="true">S↗</strong>
      </div>
    );
  }

  return (
    <Image
      className="event-image"
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
