"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll } from "framer-motion";
import { LayoutDashboard, Target, Lightbulb, User } from "lucide-react";
import Container from "@/app/components/ui/Container";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setScrolled(latest > 50);
    });
  }, [scrollY]);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Contests", path: "/contests", icon: Target },
    { name: "Suggestions", path: "/suggestions", icon: Lightbulb },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/") return false;
    return pathname === path || (pathname.startsWith(path) && path !== "/");
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-2 z-40"
        onMouseEnter={() => setIsHovering(true)}
      />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: scrolled && !isHovering ? -64 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(13, 13, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--ghost-border)',
        }}
      >
        <Container>
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-7 h-7 flex items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
                  boxShadow: 'var(--shadow-glow-primary)',
                }}
              >
                <span className="font-bold text-[11px] tracking-tight" style={{ color: 'var(--surface-lowest)' }}>AH</span>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight leading-none transition-colors" style={{ color: 'var(--on-surface)' }}>
                  Agent Herald
                </span>
                <span className="text-[9px] uppercase tracking-wider font-medium leading-none mt-0.5" style={{ color: 'var(--on-surface-muted)' }}>
                  Admin Console
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        color: active ? 'var(--on-surface)' : 'var(--on-surface-muted)',
                        background: active ? 'var(--surface-high)' : 'transparent',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{
                        color: active ? 'var(--primary)' : 'var(--on-surface-muted)',
                      }} />
                      <span>{item.name}</span>
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-lg -z-10"
                          style={{ background: 'var(--surface-high)', border: '1px solid var(--ghost-border)' }}
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center">
              <button className="transition-colors" style={{ color: 'var(--on-surface-dim)' }}>
                <span className="sr-only">Open menu</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </motion.nav>
    </>
  );
}
