"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Zap, RefreshCcw, ExternalLink, Search } from "lucide-react";

type NewsItem = {
  id: string;
  headline: string;
  source: string;
  category: string;
  impact: string;
  time: string;
  url: string;
};

export default function DailyNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return news;
    const q = searchQuery.toLowerCase();
    return news.filter(item =>
      item.headline.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [news, searchQuery]);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Connection to Oracle failed");
      const data = await res.json();
      setNews(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 }}
  };

  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 }}
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-24 pb-20">
      
      {/* Header Block */}
      <motion.div variants={itemVars} className="space-y-6 max-w-3xl">
        <h2 className="font-display font-bold text-6xl md:text-7xl leading-[1.05] tracking-tight">
          Daily Hot News <br/> & Signals.
        </h2>
        <p className="font-mono text-sm leading-relaxed text-black/60 max-w-xl">
          Aggregated high-signal external intelligence streams driving automated market creation and arbiter logic.
        </p>

        {/* Search Bar */}
        <div className="pt-8 w-full max-w-2xl relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 group-focus-within:text-black transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by headline, source..."
            className="w-full bg-white border border-black/10 h-14 pl-14 pr-6 rounded-full font-mono text-sm outline-none focus:border-black transition-all shadow-sm hover:shadow-md placeholder:text-black/20"
          />
          {searchQuery.trim() && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-black/40">
              {filteredNews.length} result{filteredNews.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </motion.div>

      {/* Grid List Block */}
      <motion.div variants={itemVars} className="pt-4">
        
        {/* Table Title / Controls */}
        <div className="flex items-end justify-between border-b-[2px] border-black pb-4 mb-4">
          <h3 className="font-display font-bold text-2xl tracking-tight">Global Oracle Feed</h3>
          <button 
            onClick={fetchNews}
            disabled={loading}
            className="font-mono text-[10px] uppercase tracking-widest text-[#111111] hover:text-[#ccff00] transition-colors flex items-center gap-2"
          >
            {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {loading ? "Re-syncing nodes..." : "Sync Real-time Oracle"}
          </button>
        </div>

        {/* Table Headings */}
        <div className="w-full">
          <div className="grid grid-cols-12 gap-4 py-3 font-mono text-[10px] uppercase tracking-widest text-black/40">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-10 md:col-span-6">Intelligence Headline</div>
            <div className="hidden md:block md:col-span-2">Source / Category</div>
            <div className="hidden md:block md:col-span-2 text-right">Impact</div>
          </div>

          {/* Table Contents */}
          {loading && news.length === 0 ? (
             <div className="py-20 text-center font-mono text-xs uppercase tracking-widest animate-pulse">Establishing socket to NewsAPI.org...</div>
          ) : error ? (
             <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-red-500">Error: {error}</div>
          ) : (
            <motion.div variants={containerVars} initial="hidden" animate="show">
              {filteredNews.length === 0 && searchQuery.trim() ? (
                <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-black/40">
                  No articles matching &ldquo;{searchQuery}&rdquo; in current feed
                </div>
              ) : filteredNews.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.005, backgroundColor: "#fafafa" }}
                  className="grid grid-cols-12 gap-4 py-6 border-b border-black/5 items-center transition-colors cursor-pointer group"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  {/* Time & DB ID */}
                  <div className="col-span-2 pl-2">
                    <div className="font-mono text-[11px] font-bold text-black border-l-[2px] border-black/10 group-hover:border-black pl-3 transition-colors">{item.time}</div>
                    <div className="font-mono text-[9px] text-black/40 mt-1 pl-3">{item.id}</div>
                  </div>

                  {/* Headline */}
                  <div className="col-span-10 md:col-span-6 pr-4">
                    <div className="font-display font-semibold text-lg leading-snug group-hover:underline underline-offset-4 flex items-center gap-2">
                        {item.headline.replace(/ - .*/, '')}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {/* Mobile-only visible metadata */}
                    <div className="md:hidden flex flex-wrap gap-2 mt-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest bg-[#f0f0f0] px-1.5 py-0.5 text-black">
                        {item.category}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border ${
                        item.impact === "High" ? "bg-black text-[#ccff00] border-black" 
                        : item.impact === "Medium" ? "bg-white text-black border-black/30"
                        : "bg-[#f0f0f0] text-black/40 border-transparent"
                      }`}>
                        {item.impact} VOL
                      </span>
                    </div>
                  </div>

                  {/* Desktop-only Origin Source */}
                  <div className="hidden md:block col-span-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Globe className="w-3 h-3 text-black/40" />
                      <span className="font-mono text-[12px] font-bold text-black/70">{item.source}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest bg-[#f0f0f0] px-1.5 py-0.5 text-black">
                      {item.category}
                    </span>
                  </div>

                  {/* Desktop-only Impact Label */}
                  <div className="hidden md:flex col-span-2 justify-end">
                    <span className={`px-2 py-1 text-[9px] font-mono uppercase tracking-widest border ${
                      item.impact === "High" ? "bg-black text-[#ccff00] border-black" 
                      : item.impact === "Medium" ? "bg-white text-black border-black/30"
                      : "bg-[#f0f0f0] text-black/40 border-transparent"
                    }`}>
                      {item.impact} VOL
                    </span>
                  </div>

                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
