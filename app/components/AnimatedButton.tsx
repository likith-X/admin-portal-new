"use client";

import { motion } from "framer-motion";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export default function AnimatedButton({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  onClick,
  type = "button",
}: AnimatedButtonProps) {
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2";
  
  const variantStyles = {
    primary: "bg-white text-black hover:bg-gray-200",
    secondary: "bg-neutral-900 text-white border-2 border-neutral-700 hover:bg-neutral-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={disabled || loading}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {children}
    </motion.button>
  );
}
