"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Hexagon, PanelLeftOpen, PanelLeftClose, LayoutDashboard, Flag, MessageSquare, Newspaper, Settings, Layers, Hash, Search, X as XIcon, Loader2, LogOut, Activity, Key, Globe, TrendingUp, Zap, FlaskConical, LucideIcon } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  category: "contest" | "suggestion" | "news";
  href: string;
  meta?: string;
};

export default function EditorialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.9]);
  const headerY = useTransform(scrollY, [0, 100], [0, -10]);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // "/" shortcut to focus search (like GitHub, YouTube)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if not typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback(async (query: string) => {
    setSearching(true);
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    try {
      // Fetch from all three sources in parallel
      const [contestsRes, suggestionsRes, newsRes] = await Promise.allSettled([
        fetch("/api/contests").then(r => r.ok ? r.json() : []),
        fetch("/api/suggestions").then(r => r.ok ? r.json() : []),
        fetch("/api/news").then(r => r.ok ? r.json() : []),
      ]);

      // Contests
      if (contestsRes.status === "fulfilled" && Array.isArray(contestsRes.value)) {
        contestsRes.value
          .filter((c: any) => c.question?.toLowerCase().includes(q) || c.contest_id_onchain?.toString().includes(q))
          .slice(0, 5)
          .forEach((c: any) => {
            results.push({
              id: c.id,
              title: c.question,
              category: "contest",
              href: "/contests",
              meta: `N°${c.contest_id_onchain} · ${c.status}`,
            });
          });
      }

      // Suggestions
      if (suggestionsRes.status === "fulfilled" && Array.isArray(suggestionsRes.value)) {
        suggestionsRes.value
          .filter((s: any) => s.headline?.toLowerCase().includes(q) || s.suggested_question?.toLowerCase().includes(q))
          .slice(0, 5)
          .forEach((s: any) => {
            results.push({
              id: s.id,
              title: s.suggested_question || s.headline,
              category: "suggestion",
              href: "/suggestions",
              meta: `Relevance: ${s.score_relevance ? (s.score_relevance * 100).toFixed(0) + "%" : "N/A"}`,
            });
          });
      }

      // News
      if (newsRes.status === "fulfilled" && Array.isArray(newsRes.value)) {
        newsRes.value
          .filter((n: any) => n.headline?.toLowerCase().includes(q))
          .slice(0, 5)
          .forEach((n: any) => {
            results.push({
              id: n.id,
              title: n.headline?.replace(/ - .*/, ''),
              category: "news",
              href: "/news",
              meta: `${n.source} · ${n.time}`,
            });
          });
      }
    } catch (err) {
      // Silently fail search
    }

    setSearchResults(results);
    setSelectedIndex(0);
    setSearching(false);
  }, []);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      router.push(searchResults[selectedIndex].href);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  }

  function handleResultClick(result: SearchResult) {
    router.push(result.href);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  const categoryColors: Record<string, string> = {
    contest: "bg-black text-[#ccff00]",
    suggestion: "bg-[#ccff00] text-black",
    news: "bg-[#f0f0f0] text-black",
  };

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#111111] font-sans selection:bg-[#ccff00] selection:text-black">
      {/* Collapsible Sidebar Rail */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 320 : 88 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-shrink-0 flex-col border-r border-black/5 z-20 bg-white overflow-hidden relative"
      >
        <div className="flex flex-col h-full min-w-[88px] w-full"> 
            
            {/* Header Branding */}
            <div className={`pt-12 pb-8 separator shrink-0 transition-all flex flex-col ${isSidebarOpen ? "px-10 items-start" : "px-0 items-center justify-center"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 bg-black flex items-center justify-center rounded-sm shrink-0 transition-transform ${isSidebarOpen ? "scale-100" : "scale-110"}`}>
                  <Hexagon className="w-4 h-4 text-white" />
                </div>
                {isSidebarOpen && <h1 className="font-display font-bold text-lg tracking-wider uppercase whitespace-nowrap">AgentHerald</h1>}
              </div>
              
              {isSidebarOpen && (
                <p className="mt-4 text-[10px] font-mono text-black/50 uppercase tracking-widest leading-relaxed whitespace-nowrap">
                  Decentralized Intelligence Network <br/> 
                  Operating System v2.0
                </p>
              )}
            </div>

            {/* Navigation Rail */}
            <nav className={`flex-1 py-10 space-y-6 overflow-y-auto ${isSidebarOpen ? "px-8" : "px-4"}`}>
              <div className="space-y-1">
                {isSidebarOpen && <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest px-3 mb-4 whitespace-nowrap">Core Modules</div>}
                <NavItem icon={LayoutDashboard} label="System Overview" href="/" isActive={pathname === "/"} isCollapsed={!isSidebarOpen} />
                <NavItem icon={Flag} label="Live Contests" href="/contests" isActive={pathname === "/contests"} isCollapsed={!isSidebarOpen} />
                <NavItem icon={MessageSquare} label="Suggestions" href="/suggestions" isActive={pathname === "/suggestions"} isCollapsed={!isSidebarOpen} />
                <NavItem icon={Newspaper} label="Daily Hot News" href="/news" isActive={pathname === "/news"} isCollapsed={!isSidebarOpen} />
              </div>
              <div className="space-y-1 pt-6">
                {isSidebarOpen && <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest px-3 mb-4 whitespace-nowrap">Configuration</div>}
                <NavItem icon={FlaskConical} label="Test Laboratory" href="/test-lab" isActive={pathname === "/test-lab"} isCollapsed={!isSidebarOpen} />
                <NavItem icon={Key} label="Invite Keys" href="/invites" isActive={pathname === "/invites"} isCollapsed={!isSidebarOpen} />
                <NavItem icon={Activity} label="System Matrix" href="/status" isActive={pathname === "/status"} isCollapsed={!isSidebarOpen} />
                <NavItem icon={Layers} label="Workspaces" href="#" isActive={false} isCollapsed={!isSidebarOpen} />
                <NavItem icon={Settings} label="Global Settings" href="#" isActive={false} isCollapsed={!isSidebarOpen} />
              </div>
            </nav>

            {/* Settings & User Badge */}
            <div className={`py-8 separator border-t border-black/5 shrink-0 ${isSidebarOpen ? "px-10" : "px-0 flex justify-center"}`}>
              <div className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} w-full`}>
                <div className="flex items-center gap-4 cursor-pointer group">
                  <div className="w-10 h-10 shrink-0 bg-[#f0f0f0] rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:bg-[#ccff00]">
                    {isSidebarOpen ? <span className="font-display font-bold text-sm">AH</span> : <Hash className="w-4 h-4 text-black/50 group-hover:text-black"/>}
                  </div>
                  {isSidebarOpen && (
                    <div className="whitespace-nowrap overflow-hidden">
                      <div className="text-sm font-display font-bold">Admin Root</div>
                      <div className="text-[11px] font-mono text-black/50 tracking-tight">Root privileges active</div>
                    </div>
                  )}
                </div>
                {isSidebarOpen ? (
                  <button
                    onClick={() => {
                      document.cookie = "ah_admin_invite_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                      router.push("/login");
                    }}
                    title="Logout"
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-black/10 hover:bg-red-50 text-black/30 hover:text-red-500 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      document.cookie = "ah_admin_invite_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                      router.push("/login");
                    }}
                    title="Logout"
                    className="w-10 h-10 mt-3 flex items-center justify-center rounded-full border border-transparent hover:border-red-200 hover:bg-red-50 text-black/30 hover:text-red-500 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative bg-white">
        <motion.header 
          style={{ opacity: headerOpacity, y: headerY }}
          className="h-24 px-6 lg:px-10 flex border-b border-black/5 items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-30 shrink-0"
        >
          <div className="flex items-center gap-4">
             {/* Toggle Button */}
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="hidden lg:flex w-10 h-10 items-center justify-center rounded-sm border border-transparent hover:border-black/10 hover:bg-black/5 transition-all text-black/60 hover:text-black shadow-none"
                title={isSidebarOpen ? "Collapse Component Bar" : "Expand Component Bar"}
             >
                {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
             </button>
             <div className="lg:hidden flex items-center gap-2">
               <div className="w-6 h-6 bg-black flex items-center justify-center rounded-sm">
                 <Hexagon className="w-3.5 h-3.5 text-white" />
               </div>
             </div>
          </div>
          
          {/* Global Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block relative ml-2 lg:ml-6" ref={dropdownRef}>
            <div className={`flex items-center border rounded-full px-5 h-12 transition-all ${searchOpen ? "border-black bg-white shadow-lg" : "border-black/10 bg-[#f0f0f0]/30 hover:border-black/30"}`}>
              <Search className="w-4 h-4 text-black/40 shrink-0 mr-3" />
              <input 
                ref={inputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!searchOpen) setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Query network memory..." 
                className="w-full bg-transparent outline-none font-mono text-sm placeholder:text-black/30 text-black"
              />
              {searching && <Loader2 className="w-4 h-4 text-black/40 animate-spin shrink-0" />}
              {searchQuery && !searching && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="shrink-0 hover:text-black text-black/30 transition-colors">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              <div className="hidden lg:flex items-center gap-1 ml-3 shrink-0 select-none">
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono tracking-widest border border-black/10 rounded text-black/30 bg-white">/</kbd>
              </div>
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {searchOpen && (searchResults.length > 0 || (searchQuery.trim() && !searching)) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[420px] overflow-y-auto"
                >
                  {searchResults.length === 0 && searchQuery.trim() && !searching ? (
                    <div className="p-8 text-center font-mono text-[11px] uppercase tracking-widest text-black/40">
                      No nodes matching "{searchQuery}" in network index
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="px-5 py-2 font-mono text-[9px] uppercase tracking-widest text-black/40">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} across network
                      </div>
                      {searchResults.map((result, index) => (
                        <button
                          key={result.id + result.category}
                          onClick={() => handleResultClick(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full text-left px-5 py-3 flex items-start gap-4 transition-colors ${
                            selectedIndex === index ? "bg-[#f8f8f8]" : "hover:bg-[#fafafa]"
                          }`}
                        >
                          <span className={`shrink-0 mt-0.5 px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest rounded-sm ${categoryColors[result.category]}`}>
                            {result.category}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-semibold text-sm leading-snug truncate">{result.title}</div>
                            {result.meta && <div className="font-mono text-[10px] text-black/40 mt-0.5 truncate">{result.meta}</div>}
                          </div>
                          {selectedIndex === index && (
                            <span className="shrink-0 font-mono text-[9px] text-black/30 mt-1">↵</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-6 ml-auto pl-6">
             <div className="hidden lg:flex items-center gap-6 shrink-0">
                <AgentBadge 
                  label="Sentiment" 
                  icon={Globe} 
                  nodeName="SENTIMENT_AGENT" 
                />
                <AgentBadge 
                  label="AMM Node" 
                  icon={Zap} 
                  nodeName="AMM_AGENT" 
                />
             </div>
             <div className="hidden sm:block">
               <button className="btn-editorial text-[11px] whitespace-nowrap bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black">
                 Deploy Market
               </button>
             </div>
          </div>
        </motion.header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-8 lg:px-12 py-8 lg:py-16 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}

function AgentBadge({ label, icon: Icon, nodeName }: { label: string, icon: LucideIcon, nodeName: string }) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/system/stats");
      const nodes = await res.json();
      if (Array.isArray(nodes)) {
        setStatus(nodes.find(n => n.node_name === nodeName));
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [nodeName]);

  const isHealthy = status?.status === "HEALTHY";
  const lastTime = status ? new Date(status.last_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-sm flex items-center justify-center ${isHealthy ? 'bg-black text-[#ccff00]' : 'bg-black/5 text-black/20'}`}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-display font-bold leading-none">{label}</span>
        <span className="text-[9px] font-mono text-black/40 leading-none mt-1">{isHealthy ? `ACTIVE ${lastTime}` : "STANDBY"}</span>
      </div>
    </div>
  );
}

function NavItem({ label, href, isActive, icon: Icon, isCollapsed }: { label: string, href: string, isActive: boolean, icon: LucideIcon, isCollapsed: boolean }) {
  return (
    <Link href={href} className={`w-full relative group px-3 py-3 flex items-center overflow-hidden rounded-md hover:bg-black/5 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start gap-4'}`}>
      <div className={`relative z-10 flex items-center justify-center shrink-0 w-5 h-5 transition-colors duration-300 ${
        isActive ? "text-[#111111]" : "text-black/50 group-hover:text-[#111111]"
      }`}
      title={isCollapsed ? label : undefined}
      >
        <Icon className="w-full h-full" strokeWidth={isActive ? 2.5 : 2} />
      </div>
      
      {!isCollapsed && (
        <span 
          className={`relative z-10 font-display flex-1 text-[14px] tracking-wide whitespace-nowrap transition-colors duration-300 ${
            isActive ? "text-[#111111] font-bold" : "text-black/60 group-hover:text-[#111111]"
          }`}
        >
          {label}
        </span>
      )}

      {isActive && (
        <motion.div 
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-[#ccff00] rounded-r-md"
        />
      )}
    </Link>
  );
}
