"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#F7F4EF]">
      {/* Faded background — cargo/export motif */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 800 600"
          className="h-[140%] w-[140%] opacity-[0.06]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cargo ship hull */}
          <path d="M120 420 L680 420 L640 480 L160 480 Z" fill="#1F2421" />
          {/* Containers stacked on ship */}
          <rect x="160" y="340" width="70" height="70" fill="#1F2421" />
          <rect x="235" y="340" width="70" height="70" fill="#1F2421" />
          <rect x="310" y="300" width="70" height="110" fill="#1F2421" />
          <rect x="385" y="340" width="70" height="70" fill="#1F2421" />
          <rect x="460" y="300" width="70" height="110" fill="#1F2421" />
          <rect x="535" y="340" width="70" height="70" fill="#1F2421" />
          {/* Crane */}
          <line
            x1="600"
            y1="120"
            x2="600"
            y2="420"
            stroke="#1F2421"
            strokeWidth="8"
          />
          <line
            x1="600"
            y1="140"
            x2="740"
            y2="140"
            stroke="#1F2421"
            strokeWidth="8"
          />
          <line
            x1="600"
            y1="140"
            x2="520"
            y2="60"
            stroke="#1F2421"
            strokeWidth="8"
          />
          <line
            x1="700"
            y1="140"
            x2="700"
            y2="220"
            stroke="#1F2421"
            strokeWidth="6"
          />
          <rect x="675" y="220" width="50" height="35" fill="#1F2421" />
          {/* Water lines */}
          <path
            d="M40 500 Q 120 490 200 500 T 360 500 T 520 500 T 680 500 T 800 500"
            stroke="#1F2421"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M0 530 Q 100 520 200 530 T 400 530 T 600 530 T 800 530"
            stroke="#1F2421"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      </div>

      {/* Foreground content */}
      <motion.div
        initial={{
          opacity: 0.3,
          scale: 0.98,
        }}
        animate={{
          opacity: [0.3, 0.85, 0.3],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 flex flex-col items-center select-none"
      >
        <span className="text-3xl font-semibold tracking-tight text-[#1F2421]">
          Videha
        </span>

        <span className="mt-1 text-xs font-medium uppercase tracking-[0.34em] text-[#665E52]">
          Overseas
        </span>
      </motion.div>
    </div>
  );
}
