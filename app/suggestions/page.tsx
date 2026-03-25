"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon, Trash2, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type SuggestionRow = {
  id: string;
  article_id: string;
  headline: string;
  summary: string;
  yes_no_question: string;
  resolution_criteria: string;
  score_relevance: number;
  social_buzz_score: number;
  created_at: string;
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [approvingAll, setApprovingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadSuggestions(); }, []);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const res = await fetch("/api/suggestions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch suggestions");
      if (Array.isArray(data)) setSuggestions(data);
      else setSuggestions([]);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  }

  const sortedSuggestions = Array.isArray(suggestions) ? [...suggestions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  }) : [];

  async function fetchNewSuggestions() {
    if (!confirm("Fetch new contest suggestions from news sources?")) return;
    setFetching(true);
    try {
      const { data: result, error: funcError } = await supabase.functions.invoke("fetch-suggestions", {
        method: "POST"
      });
      
      if (funcError) throw new Error(funcError.message);

      if (result.count !== undefined) {
        if (result.errors?.length > 0) alert(`⚠️ Fetched ${result.count} suggestions with errors`);
        else alert(`✅ Fetched ${result.count} new suggestions!`);
        loadSuggestions();
      } else {
        alert(`Error: Failed finding suggestions`);
      }
    } catch (error: any) { 
      console.error("Fetch error:", error);
      alert(`Network error: ${error.message}`); 
    }
    finally { setFetching(false); }
  }

  async function handleApprove(suggestionId: string) {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/approve`, { method: "POST" });
      if (res.ok) { alert("Created!"); loadSuggestions(); }
    } catch { alert("Network error"); }
  }

  async function handleReject(suggestionId: string) {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/reject`, { method: "POST" });
      if (res.ok) { loadSuggestions(); }
    } catch { alert("Network error"); }
  }

  async function handleApproveAll() {
    if (suggestions.length === 0) return;
    if (!confirm(`Approve all ${suggestions.length}?`)) return;
    setApprovingAll(true);
    try {
      const res = await fetch("/api/suggestions/approve-all", { method: "POST" });
      if (res.ok) loadSuggestions();
    } catch { alert("Network error"); }
    finally { setApprovingAll(false); }
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === suggestions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(suggestions.map(s => s.id)));
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/suggestions/${id}/reject`, { method: "POST" })));
      setSelectedIds(new Set());
      loadSuggestions();
    } catch { alert("Failed"); }
    finally { setDeleting(false); }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
      className="max-w-6xl mx-auto space-y-24 pb-20"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
        <h2 className="font-display font-bold text-6xl leading-[1.05] tracking-tight">
          AI Network <br/> Suggestions.
        </h2>
        <p className="font-mono text-sm leading-relaxed text-black/60 max-w-xl">
          Review and approve autonomous AI-generated predictions pending deployment to the prediction ledger.
        </p>
        
        <div className="flex flex-wrap gap-4 pt-4">
          <button onClick={fetchNewSuggestions} disabled={fetching} className="btn-editorial text-[11px] flex items-center gap-2">
             {fetching ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArrowRight className="w-3 h-3" />}
             Fetch New Intelligence
          </button>
          {suggestions.length > 0 && (
             <button onClick={handleApproveAll} disabled={approvingAll} className="btn-editorial bg-white text-black border border-black hover:bg-black hover:text-white text-[11px]">
               {approvingAll ? "Approving..." : `Approve All (${suggestions.length})`}
             </button>
          )}
        </div>
      </motion.div>

      {/* Main List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
        <div className="flex items-end justify-between border-b-[2px] border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            <h3 className="font-display font-bold text-2xl tracking-tight">Pending Approval ({suggestions.length})</h3>
            <button onClick={toggleSelectAll} className="font-mono text-[10px] uppercase tracking-widest text-[#111111] hover:text-black/50 transition-colors">
              {selectedIds.size === suggestions.length ? "Deselect All" : "Select All"}
            </button>
            {selectedIds.size > 0 && (
              <button onClick={handleDeleteSelected} disabled={deleting} className="font-mono text-[10px] uppercase tracking-widest text-red-500 hover:text-red-300">
                Delete ({selectedIds.size})
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")} className="font-mono text-[10px] uppercase tracking-widest text-black/40 hover:text-black">
              Sort: {sortOrder}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs uppercase tracking-widest animate-pulse">Loading neural predictions...</div>
        ) : suggestions.length === 0 ? (
          <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-black/40">No suggestions pending. Fetch new to continue.</div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 py-3 font-mono text-[10px] uppercase tracking-widest text-black/40">
              <div className="col-span-1">Sel</div>
              <div className="col-span-7">Proposed Market Event</div>
              <div className="col-span-2 text-right">Confidence</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            <div>
              {sortedSuggestions.map((s, index) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-4 py-6 border-b border-black/5 items-center transition-colors group"
                >
                  <div className="col-span-1 pl-2">
                    <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)}
                      className="appearance-none w-4 h-4 border border-black/20 checked:bg-black checked:border-black rounded-sm cursor-pointer transition-colors"
                    />
                  </div>
                  <div className="col-span-7 pr-8">
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-display font-bold text-lg leading-snug group-hover:underline">{s.yes_no_question}</h4>
                        {s.social_buzz_score > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#ccff00] text-black font-mono text-[9px] font-black uppercase tracking-tighter border border-black shadow-[1px_1px_0_0_#000]">
                            Buzz {Math.round(s.social_buzz_score * 100)}%
                          </div>
                        )}
                     </div>
                     <p className="font-mono text-[11px] text-black/50 leading-relaxed line-clamp-2 mb-2">
                       {s.resolution_criteria}
                     </p>
                     <div className="font-mono text-[9px] uppercase tracking-widest text-black/30">
                       Source: {s.headline.slice(0, 60)}...
                     </div>
                  </div>
                  <div className="col-span-2 text-right font-mono text-xs font-semibold flex justify-end">
                     <span className={`px-3 py-1 text-[9px] uppercase tracking-widest bg-[#f0f0f0] ${s.score_relevance > 0.8 ? "text-green-600" : "text-orange-500"}`}>
                       {(s.score_relevance * 100).toFixed(0)}% REL
                     </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-3">
                    <button onClick={() => handleApprove(s.id)} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(s.id)} className="w-8 h-8 rounded-full border border-black/10 hover:border-black/50 text-black/50 hover:text-black flex items-center justify-center transition-colors">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}