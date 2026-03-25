"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Target, Lightbulb, User, Home } from "lucide-react";
import { useState } from "react";

export default function Dock() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dockItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Contests", path: "/contests", icon: Target },
    { name: "Suggestions", path: "/suggestions", icon: Lightbulb },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path === "/" && pathname !== "/") return false;
    return pathname === path || (pathname.startsWith(path) && path !== "/");
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
        className="flex items-end gap-1.5 px-3 py-2.5 rounded-2xl"
        style={{
          background: 'rgba(13, 13, 25, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--ghost-border)',
          boxShadow: '0 16px 48px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {dockItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isHovered = hoveredIndex === index;
          const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - index) : 0;
          const scale = hoveredIndex === null ? 1 :
            distance === 0 ? 1.4 :
            distance === 1 ? 1.2 :
            distance === 2 ? 1.08 : 1;

          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                animate={{ scale, y: isHovered ? -6 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative group"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-container))'
                      : 'var(--surface-high)',
                    boxShadow: active ? 'var(--shadow-glow-primary)' : 'none',
                  }}
                >
                  <Icon className={`w-5 h-5 transition-colors ${active ? "text-[#00363a]" : ""}`}
                    style={{ color: active ? 'var(--surface-lowest)' : 'var(--on-surface-dim)' }}
                  />
                  {active && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: 'var(--primary)' }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>

                {/* Tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none"
                  style={{
                    background: 'var(--surface-highest)',
                    border: '1px solid var(--ghost-border)',
                    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>{item.name}</span>
                </motion.div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
