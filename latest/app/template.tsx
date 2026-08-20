"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(true);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem("videha-visited");

    setHasLoadedBefore(!!visited);

    // First website opening: minimum 1 second
    // Subsequent route changes: minimum 0.5 second
    const minimumTime = visited ? 500 : 1000;

    const timer = setTimeout(() => {
      sessionStorage.setItem("videha-visited", "true");
      setShowLoader(false);
    }, minimumTime);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {showLoader && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F7F4EF]"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.3,
                ease: "easeInOut",
              },
            }}
          >
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
              className="flex flex-col items-center select-none"
            >
              <span className="text-3xl font-semibold tracking-tight text-[#1F2421]">
                Videha
              </span>

              <span className="mt-1 text-xs font-medium uppercase tracking-[0.34em] text-[#665E52]">
                Overseas
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
