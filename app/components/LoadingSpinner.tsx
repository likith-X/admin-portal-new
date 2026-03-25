"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  color = "white" 
}: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeStyles[size]} border-${color} border-t-transparent rounded-full`}
        style={{ borderColor: color, borderTopColor: "transparent" }}
      />
    </div>
  );
}

export function LoadingPulse() {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="flex items-center justify-center space-x-2"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 0.2,
        }}
        className="w-3 h-3 bg-white rounded-full"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.2,
          repeatDelay: 0.2,
        }}
        className="w-3 h-3 bg-white rounded-full"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.4,
          repeatDelay: 0.2,
        }}
        className="w-3 h-3 bg-white rounded-full"
      />
    </motion.div>
  );
}
