"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, Plus, Zap, X as XIcon, ExternalLink, Loader2, Check, Globe, TrendingUp } from "lucide-react";

type Contest = {
  id: string;
  question: string;
  deadline: string;
  status: string;
  resolved_outcome?: boolean;
  proof_uri?: string;
  contest_id_onchain: number;
  created_at: string;
  resolved_at?: string;
  social_buzz_score?: number;
  votes?: Array<{ userId: string }>;
  resolution_metadata?: {
    explanation?: string;
    confidence?: number;
    evidence?: string[];
    sources?: string[];
    resolverType?: string;
  };
};

type AISuggestion = {
  suggested_outcome: boolean;
  confidence: number;
  reasoning: string;
  sources: string[];
};

type SimulationResult = {
  predictedOutcome: boolean;
  outcomeLabel: string;
  confidence: number;
  confidencePercent: string;
  explanation: string;
  evidence: string[];
  sources: string[];
  resolverType: string;
};

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion>>({});
  const [proofURIs, setProofURIs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showSimulation, setShowSimulation] = useState<Record<string, boolean>>({});
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});
  const [simulating, setSimulating] = useState<Record<string, boolean>>({});
  const [expandedResolution, setExpandedResolution] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [resolvingAll, setResolvingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchContests(); }, []);
  useEffect(() => { applyFilters(); }, [contests, selectedDate, dateFilterEnabled, activeTab, searchQuery]);

  async function fetchContests() {
    setRefreshing(true);
    const res = await fetch("/api/contests");
    const data = await res.json();
    const sortedData = data.sort((a: Contest, b: Contest) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setContests(sortedData);
    setRefreshing(false);
    data.forEach(async (contest: Contest) => {
      if (contest.status === "OPEN") {
        const aiRes = await fetch(`/api/contests/${contest.id}/ai-suggestion`);
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData) setAiSuggestions((prev) => ({ ...prev, [contest.id]: aiData }));
        }
      }
    });
  }

  function applyFilters() {
    const now = new Date();
    let baseContests = activeTab === "active"
      ? contests.filter(c => new Date(c.deadline) >= now)
      : contests.filter(c => new Date(c.deadline) < now);

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      baseContests = baseContests.filter(c => 
        c.question.toLowerCase().includes(q) || 
        c.contest_id_onchain.toString().includes(q)
      );
    }

    if (!dateFilterEnabled || !selectedDate) { setFilteredContests(baseContests); return; }
    const filterDate = new Date(selectedDate);
    setFilteredContests(baseContests.filter((contest) => {
      const contestDate = new Date(contest.created_at);
      return contestDate.getFullYear() === filterDate.getFullYear() && contestDate.getMonth() === filterDate.getMonth() && contestDate.getDate() === filterDate.getDate();
    }));
  }

  function clearDateFilter() { setDateFilterEnabled(false); setSelectedDate(""); }

  async function handleResolve(contestId: string, outcome: boolean) {
    const proofURI = proofURIs[contestId];
    if (!proofURI) { alert("Please provide a proof URI"); return; }
    setLoading((prev) => ({ ...prev, [contestId]: true }));
    try {
      const res = await fetch(`/api/contests/${contestId}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome, proofURI }) });
      if (res.ok) { alert("Contest resolved successfully!"); fetchContests(); }
      else { const error = await res.json(); alert(`Error: ${error.error || "Failed to resolve"}`); }
    } catch { alert("Network error. Please try again."); }
    finally { setLoading((prev) => ({ ...prev, [contestId]: false })); }
  }

  async function handleQuickResolve(contestId: string) {
    if (!confirm("Resolve this contest now using the resolver agent?")) return;
    setLoading((prev) => ({ ...prev, [contestId]: true }));
    try {
      const res = await fetch(`/api/contests/${contestId}/quick-resolve`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        const result = await res.json();
        alert(`Contest resolved!\nOutcome: ${result.outcome ? "YES" : "NO"}\nTX: ${result.transactionHash}\nExplanation: ${result.explanation || "N/A"}`);
        await fetchContests();
      } else { const error = await res.json(); alert(`Error: ${error.error || "Failed to resolve"}`); }
    } catch { alert("Network error. Please try again."); }
    finally { setLoading((prev) => ({ ...prev, [contestId]: false })); }
  }

  async function handleCreateManualContest(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !newDeadline) { alert("Please fill in all fields"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/contests/create-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: newQuestion.trim(), deadline: newDeadline }) });
      if (res.ok) {
        const result = await res.json();
        alert(`✅ Created!\nOn-chain ID: ${result.contest.contest_id_onchain}`);
        setShowCreateModal(false); setNewQuestion(""); setNewDeadline(""); fetchContests();
      } else { const error = await res.json(); alert(`Error: ${error.error || "Failed"}`); }
    } catch (error: any) { alert(`Network error`); }
    finally { setCreating(false); }
  }

  async function handleResolveAll() {
    const expiredContests = contests.filter((c) => c.status === "OPEN" && new Date(c.deadline) < new Date());
    if (expiredContests.length === 0) { alert("No expired contests to resolve"); return; }
    if (!confirm(`Resolve all ${expiredContests.length} expired contests?`)) return;
    setResolvingAll(true);
    try {
      const res = await fetch("/api/contests/resolve-all", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        if (result.errors?.length > 0) alert(`✅ Resolved ${result.count} contests!\n⚠️ ${result.errors.length} failed.`);
        else alert(`✅ Successfully resolved ${result.count} contests!`);
        fetchContests();
      } else alert(`Error: ${result.error}`);
    } catch (error: any) { alert(`Network error: ${error.message}`); }
    finally { setResolvingAll(false); }
  }

  async function handleSyncStatus() {
    if (!confirm("Sync database with blockchain status?")) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/contests/sync-status", { method: "POST" });
      const result = await res.json();
      if (res.ok) { alert(`✅ Sync complete!\n${result.synced} contests updated`); fetchContests(); }
      else alert(`Error`);
    } catch (error: any) { alert(`Network error`); }
    finally { setSyncing(false); }
  }

  const expiredOpenCount = contests.filter((c) => c.status === "OPEN" && new Date(c.deadline) < new Date()).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
      className="max-w-6xl mx-auto space-y-16 md:space-y-24 pb-20"
    >
      {/* Header Array */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
        <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-7xl leading-[1.1] md:leading-[1.05] tracking-tight">
          Prediction Markets <br className="hidden sm:block" /> & Network Contracts.
        </h2>
        <p className="font-mono text-[13px] md:text-sm leading-relaxed text-black/60 max-w-xl">
          Manage, deploy, and execute smart-contract resolutions via autonomous AI arbitrators and external global state synchronizations.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <button onClick={() => setShowCreateModal(true)} className="btn-editorial text-[11px] flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Deploy Contract
          </button>

          {expiredOpenCount > 0 && (
            <button onClick={handleResolveAll} disabled={resolvingAll} className="btn-editorial bg-[#ccff00] text-black border border-black hover:bg-black hover:text-[#ccff00] text-[11px] flex items-center gap-2">
               {resolvingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
               Resolve Expired ({expiredOpenCount})
            </button>
          )}

          <button onClick={handleSyncStatus} disabled={syncing} className="btn-editorial bg-white text-black border border-black hover:bg-black hover:text-white text-[11px] flex items-center gap-2">
             <RefreshCcw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
             Sync Blockchain
          </button>
        </div>

        {/* Search Interface */}
        <div className="pt-4 md:pt-8 w-full max-w-2xl relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-black/40 group-focus-within:text-black transition-colors">
             <div className="w-5 h-5 border border-current rounded-[3px] flex items-center justify-center">
                <div className="w-1 h-3 bg-current rotate-12 -ml-0.5" />
             </div>
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query network memory..."
            className="w-full bg-white border border-black/10 h-12 md:h-14 pl-12 md:pl-14 pr-6 rounded-full font-mono text-[13px] md:text-sm outline-none focus:border-black transition-all shadow-sm hover:shadow-md placeholder:text-black/20"
          />
        </div>
      </motion.div>

      {/* Tabs / Control Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-[2px] border-black pb-4 mb-6 gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <h3 className="font-display font-bold text-xl md:text-2xl tracking-tight">Active Matrix</h3>
            <div className="flex gap-4 font-mono text-[10px] uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full">
              {(["active", "expired"] as const).map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? "text-black font-bold" : "text-black/40 hover:text-black"} transition-all uppercase`}>
                   {tab}
                 </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">Timestamp Filter:</span>
             <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setDateFilterEnabled(true); }}
               className="font-mono text-[10px] uppercase bg-transparent outline-none border-b border-black/20 focus:border-black text-black"
             />
             {dateFilterEnabled && <button onClick={clearDateFilter} className="font-mono text-[10px] uppercase tracking-widest text-red-500">Reset</button>}
          </div>
        </div>

        {/* Data List rows instead of cards */}
        <div className="w-full">
          <div className="hidden md:grid grid-cols-12 gap-4 py-3 font-mono text-[10px] uppercase tracking-widest text-black/40 border-b border-black/5">
            <div className="col-span-1">ID</div>
            <div className="col-span-6">Market Protocol Question</div>
            <div className="col-span-2 text-right">Deadline</div>
            <div className="col-span-3 text-right">Status / Network Resolve</div>
          </div>

          <div>
            {filteredContests.length === 0 ? (
               <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-black/40">No markets discovered for this partition in the ledger.</div>
            ) : filteredContests.map((contest, index) => {
              const aiSuggestion = aiSuggestions[contest.id];
              const isOpen = contest.status === "OPEN";

              return (
                <motion.div 
                  key={contest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex flex-col md:grid md:grid-cols-12 gap-4 py-6 md:py-8 border-b border-black/5 items-start md:items-center group"
                >
                  <div className="md:col-span-1 pl-1 md:pl-2 font-mono text-[9px] md:text-[10px] text-black/50 shrink-0">
                    N° {contest.contest_id_onchain}
                  </div>
                  
                  <div className="md:col-span-6 md:pr-8 flex-1">
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-display font-bold text-base md:text-lg leading-snug group-hover:underline underline-offset-4">{contest.question}</h4>
                        {(contest.social_buzz_score ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-[#ccff00] text-black font-mono text-[8px] font-black uppercase tracking-tighter shrink-0 border border-black shadow-[1px_1px_0_0_#000]">
                            <TrendingUp className="w-2.5 h-2.5" />
                            Buzz {Math.round((contest.social_buzz_score ?? 0) * 100)}%
                          </div>
                        )}
                        {/* Seeding Indicator */}
                        {contest.votes && contest.votes.some(v => v.userId === 'AGENT_H_AMM_NODE') && (
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-black text-[#ccff00] font-mono text-[8px] font-black uppercase tracking-tighter shrink-0 border border-black">
                            Liquid Market
                          </div>
                        )}
                     </div>
                     
                     {/* AI Display inline */}
                     {isOpen && aiSuggestion && (
                        <div className="flex items-center gap-3 mt-3">
                          <span className="font-mono text-[9px] uppercase tracking-widest border border-[#ccff00] bg-[#ccff00]/10 px-2 text-[#000]">
                            AI Recommends: {aiSuggestion.suggested_outcome ? "YES" : "NO"}
                          </span>
                          <span className="font-mono text-[9px] text-black/40">Confidence {Math.round(aiSuggestion.confidence * 100)}%</span>
                        </div>
                     )}

                     {!isOpen && (
                       <div className="flex flex-col gap-3 mt-3">
                          <div className="flex items-center gap-3 font-mono text-[9px]">
                            <span className={`uppercase tracking-widest px-2 py-0.5 border border-black ${contest.resolved_outcome ? "bg-black text-[#ccff00]" : "bg-[#f0f0f0] text-black"}`}>
                              Result: {contest.resolved_outcome ? "YES" : "NO"}
                            </span>
                            {!isOpen && (
                              <button 
                                onClick={() => setExpandedResolution(prev => ({ ...prev, [contest.id]: !prev[contest.id] }))}
                                className="flex items-center gap-2 hover:text-[#ccff00] hover:bg-black px-2 py-0.5 border border-black transition-all bg-white"
                              >
                                {expandedResolution[contest.id] ? "Hide Intelligence" : "View Intelligence"}
                                <Zap className={`w-2.5 h-2.5 ${expandedResolution[contest.id] ? "fill-current" : ""}`} />
                              </button>
                            )}
                            {contest.proof_uri && (
                              <a href={contest.proof_uri} target="_blank" className="flex items-center gap-1 hover:underline text-black/60">
                                Network Proof <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          <AnimatePresence>
                            {expandedResolution[contest.id] && contest.resolution_metadata && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 p-6 bg-[#f9f9f9] border-2 border-black shadow-[4px_4px_0_0_#000] space-y-6">
                                  <div className="space-y-2">
                                    <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-black/40">Autonomous Reasoning</h5>
                                    <p className="font-sans text-sm leading-relaxed text-black font-medium">
                                      {contest.resolution_metadata?.explanation || "This contest was resolved manually or prior to intelligence integration. Metadata unavailable."}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                      <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-black/40">Confidence Matrix</h5>
                                      <div className="h-4 bg-black/5 border border-black relative overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(contest.resolution_metadata?.confidence || 0) * 100}%` }}
                                          className="h-full bg-[#ccff00]"
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold mix-blend-difference text-white">
                                          {Math.round((contest.resolution_metadata?.confidence || 0) * 100)}% CERTAINTY
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-black/40">Data Integration</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {(contest.resolution_metadata?.sources || ["Manual Audit"]).map((source, i) => (
                                          <span key={i} className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-black/10 font-mono text-[9px] text-black/60 capitalize">
                                            <Globe className="w-2.5 h-2.5" />
                                            {source}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {contest.resolution_metadata?.evidence && contest.resolution_metadata.evidence.length > 0 ? (
                                    <div className="space-y-3 border-t border-black/10 pt-4">
                                      <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-black/40">Verifiable Evidence Nodes</h5>
                                      <ul className="space-y-2">
                                        {contest.resolution_metadata.evidence.map((item, i) => (
                                          <li key={i} className="flex items-start gap-3 font-mono text-[10px] text-black/70 italic leading-relaxed">
                                            <span className="text-[#ccff00] bg-black px-1 shrink-0">[{i+1}]</span>
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div className="pt-4 border-t border-black/10">
                                      <span className="font-mono text-[9px] text-black/40 italic">No evidence logs found. Verified by manual oracle process.</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                     )}
                  </div>

                  <div className="hidden md:block md:col-span-2 text-right font-mono text-[11px] font-semibold text-black/60">
                    {new Date(contest.deadline).toLocaleDateString()}
                  </div>
                  
                  <div className="w-full md:col-span-3 flex flex-col md:flex-row justify-between md:justify-end items-start md:items-center gap-4 md:gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-black/5 md:border-0 font-mono text-[10px]">
                    <div className="md:hidden flex items-center gap-2 text-black/40">
                       <span className="uppercase tracking-widest">Closes:</span>
                       <span className="font-bold">{new Date(contest.deadline).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-3">
                      {isOpen ? (
                        <>
                          <button onClick={() => handleQuickResolve(contest.id)} disabled={loading[contest.id]} className="font-mono bg-[#f0f0f0] text-black text-[9px] md:text-[10px] px-3 md:px-3 py-2 md:py-1 hover:bg-[#ccff00] transition-colors uppercase tracking-widest flex items-center gap-1.5">
                            {loading[contest.id] ? "Resolving..." : <><Zap className="w-3 h-3"/> Quick Resolve</>}
                          </button>
                          <div className="flex text-[10px] font-mono font-bold tracking-widest h-9 md:h-auto items-stretch">
                             <button onClick={() => handleResolve(contest.id, true)} className="border border-black px-3 py-1 hover:bg-black hover:text-white transition flex items-center">Y</button>
                             <button onClick={() => handleResolve(contest.id, false)} className="border border-black border-l-0 px-3 py-1 hover:bg-black hover:text-white transition flex items-center">N</button>
                          </div>
                        </>
                      ) : (
                        <span className="px-3 py-1 font-mono text-[9px] uppercase tracking-widest bg-[#f0f0f0] text-black border border-black/5">
                          {contest.status}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
      
      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-white/80 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateModal(false); setNewQuestion(""); setNewDeadline(""); } }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              className="max-w-xl w-full bg-white border-2 border-black p-6 md:p-10 shadow-[8px_8px_0_0_#ccff00] md:shadow-[12px_12px_0_0_#ccff00]"
            >
              <div className="flex items-center justify-between border-b-[2px] border-black pb-4 mb-6 md:mb-8">
                <h2 className="font-display font-bold text-2xl md:text-3xl">Deploy Contract</h2>
                <button onClick={() => setShowCreateModal(false)} className="hover:rotate-90 transition-transform">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateManualContest} className="space-y-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest mb-3 block">Conditions / Question</label>
                  <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
                    required rows={3} className="w-full bg-[#f0f0f0] border-0 outline-none p-4 font-mono text-xs focus:ring-2 focus:ring-[#ccff00]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest mb-3 block">Expiration / Close Time</label>
                  <input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} required min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-[#f0f0f0] border-0 outline-none p-4 font-mono text-xs focus:ring-2 focus:ring-[#ccff00]"
                  />
                </div>
                <button type="submit" disabled={creating} className="btn-editorial w-full flex items-center justify-center gap-2">
                  {creating ? "Deploying..." : "Commit transaction"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
