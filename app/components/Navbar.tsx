"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Contests", path: "/contests", icon: "🎯" },
    { name: "Suggestions", path: "/suggestions", icon: "💡" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-xl">AH</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">
              Agent Herald
            </h1>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
                  isActive(item.path)
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
