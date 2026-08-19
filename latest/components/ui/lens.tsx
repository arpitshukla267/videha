"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

interface LensProps {
  src: string;
  alt?: string;
  zoomFactor?: number;
  lensSize?: number;
  className?: string;
}

export function Lens({
  src,
  alt = "",
  zoomFactor = 2,
  lensSize = 180,
  className = "",
}: LensProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [hovering, setHovering] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    setPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Main Image */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="block h-full w-full object-cover"
      />

      {/* Zoom Lens */}
      {hovering && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut",
          }}
          className="pointer-events-none absolute z-20 overflow-hidden rounded-full border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
          style={{
            width: lensSize,
            height: lensSize,
            left: position.x - lensSize / 2,
            top: position.y - lensSize / 2,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${zoomFactor * 300}%`,
              backgroundPosition: `${
                (position.x / (containerRef.current?.clientWidth || 1)) * 100
              }% ${
                (position.y / (containerRef.current?.clientHeight || 1)) * 100
              }%`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
