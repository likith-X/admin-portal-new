"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCounter({
  from = 0,
  to,
  duration = 1,
  className = "",
  style,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // EaseOut function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.round(from + (to - from) * easeOut);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [from, to, duration]);

  return (
    <motion.span 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
      style={style}
    >
      {count}
    </motion.span>
  );
}
