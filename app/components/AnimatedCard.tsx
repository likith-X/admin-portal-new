"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  hoverScale?: boolean;
}

export default function AnimatedCard({
  children,
  delay = 0,
  className = "",
  hoverScale = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut",
      }}
      whileHover={hoverScale ? { y: -4, borderColor: "rgba(0,0,0,0.15)" } : {}}
      className={`bg-white border border-black/5 rounded-2xl transition-all shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardGrid({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className="grid gap-6"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -8, borderColor: "rgb(64, 64, 64)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 transition-all"
    >
      {children}
    </motion.div>
  );
}
