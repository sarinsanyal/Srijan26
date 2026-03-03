"use client";

import { IMAGE_CLIP_PATH } from "./constants/events";
import SwipeReveal from "./SwipeReveal";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function EventDetailImage({ src, alt, className }: Props) {

  return (
    <div
      className={` ${className} relative w-full max-w-md aspect-4/5 lg:max-w-sm group`}
    >
      {/* Actual Image */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{ clipPath: IMAGE_CLIP_PATH }}
      >
        <SwipeReveal>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        </SwipeReveal>
      </div>
    </div>
  );
}
