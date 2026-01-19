"use client";

import { useEffect, useState } from "react";

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
  
  // Simulation state
  const [showSimulation, setShowSimulation] = useState<Record<string, boolean>>({});
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});
  const [simulating, setSimulating] = useState<Record<string, boolean>>({});
  
  // Resolution details expansion
  const [expandedResolution, setExpandedResolution] = useState<Record<string, boolean>>({});
  
  // Date filter state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  
  // Manual contest creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [resolvingAll, setResolvingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");

  useEffect(() => {
    fetchContests();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [contests, selectedDate, dateFilterEnabled, activeTab]);

  async function fetchContests() {
    setRefreshing(true);
    const res = await fetch("/api/contests");
    const data = await res.json();
    
    // Sort by deadline (ascending - soonest first)
    const sortedData = data.sort((a: Contest, b: Contest) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    
    setContests(sortedData);
    setRefreshing(false);

    // Fetch AI suggestions for open contests
    data.forEach(async (contest: Contest) => {
      if (contest.status === "OPEN") {
        const aiRes = await fetch(`/api/contests/${contest.id}/ai-suggestion`);
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData) {
            setAiSuggestions((prev) => ({ ...prev, [contest.id]: aiData }));
          }
        }
      }
    });
  }

  function applyDateFilter() {
    let baseContests = contests;

    // Filter by active/expired tab
    const now = new Date();
    if (activeTab === "active") {
      baseContests = contests.filter(c => new Date(c.deadline) >= now);
    } else {
      baseContests = contests.filter(c => new Date(c.deadline) < now);
    }

    // Then apply date filter if enabled
    if (!dateFilterEnabled || !selectedDate) {
      setFilteredContests(baseContests);
      return;
    }

    const filterDate = new Date(selectedDate);
    const filtered = baseContests.filter((contest) => {
      const contestDate = new Date(contest.created_at);
      return (
        contestDate.getFullYear() === filterDate.getFullYear() &&
        contestDate.getMonth() === filterDate.getMonth() &&
        contestDate.getDate() === filterDate.getDate()
      );
    });

    setFilteredContests(filtered);
  }

  function clearDateFilter() {
    setDateFilterEnabled(false);
    setSelectedDate("");
  }

  async function handleResolve(contestId: string, outcome: boolean) {
    const proofURI = proofURIs[contestId];
    if (!proofURI) {
      alert("Please provide a proof URI");
      return;
    }

    setLoading((prev) => ({ ...prev, [contestId]: true }));

    try {
      const res = await fetch(`/api/contests/${contestId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, proofURI }),
      });

      if (res.ok) {
        alert("Contest resolved successfully!");
        fetchContests();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to resolve"}`);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, [contestId]: false }));
    }
  }

  async function resolveAsAISuggests(contestId: string) {
    const aiSuggestion = aiSuggestions[contestId];
    if (!aiSuggestion || !aiSuggestion.sources?.[0]) {
      alert("No AI suggestion or proof source available");
      return;
    }

    await handleResolve(contestId, aiSuggestion.suggested_outcome);
  }

  async function handleQuickResolve(contestId: string) {
    if (!confirm("Resolve this contest now using the resolver agent?")) {
      return;
    }

    setLoading((prev) => ({ ...prev, [contestId]: true }));

    try {
      console.log("🚀 Starting quick resolve for:", contestId);
      const res = await fetch(`/api/contests/${contestId}/quick-resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      console.log("📡 Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("✅ Resolution result:", result);
        alert(`Contest resolved!\nOutcome: ${result.outcome ? "YES" : "NO"}\nTX: ${result.transactionHash}\nExplanation: ${result.explanation || "N/A"}`);
        
        console.log("🔄 Fetching updated contests...");
        await fetchContests();
        console.log("✅ Contests refreshed");
      } else {
        const error = await res.json();
        console.error("❌ Resolution failed:", error);
        alert(`Error: ${error.error || "Failed to resolve"}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, [contestId]: false }));
    }
  }

  async function handleCreateManualContest(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newQuestion.trim() || !newDeadline) {
      alert("Please fill in all fields");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/contests/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestion.trim(),
          deadline: newDeadline,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Contest created successfully!\nOn-chain ID: ${result.contest.contest_id_onchain}\nTX: ${result.transactionHash}`);
        setShowCreateModal(false);
        setNewQuestion("");
        setNewDeadline("");
        fetchContests();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to create contest"}`);
      }
    } catch (error: any) {
      alert(`Network error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleResolveAll() {
    const openContests = contests.filter((c) => c.status === "OPEN");
    const expiredContests = openContests.filter(
      (c) => new Date(c.deadline) < new Date()
    );

    if (expiredContests.length === 0) {
      alert("No expired contests to resolve");
      return;
    }

    if (
      !confirm(
        `Resolve all ${expiredContests.length} expired contests?\n\nThis will:\n- Use AI to determine outcomes\n- Submit on-chain resolutions\n- Cost gas fees for each transaction\n\nExpired contests:\n${expiredContests.map((c) => `- ${c.question}`).join("\n")}`
      )
    ) {
      return;
    }

    setResolvingAll(true);
    try {
      const res = await fetch("/api/contests/resolve-all", {
        method: "POST",
      });

      const result = await res.json();

      if (res.ok) {
        if (result.errors && result.errors.length > 0) {
          alert(
            `✅ Resolved ${result.count} contests!\n\n⚠️ ${result.errors.length} failed:\n${result.errors.map((e: any) => `- ${e.question}`).join("\n")}`
          );
        } else {
          alert(
            `✅ Successfully resolved ${result.count} contests!\n\n${result.results.map((r: any) => `${r.question}\n→ ${r.outcome}`).join("\n\n")}`
          );
        }
        fetchContests();
      } else {
        alert(`Error: ${result.error || "Failed to resolve all contests"}`);
      }
    } catch (error: any) {
      alert(`Network error: ${error.message}`);
    } finally {
      setResolvingAll(false);
    }
  }

  async function handleSyncStatus() {
    if (!confirm("Sync database with blockchain status?\n\nThis will check all OPEN contests and update their status if they're already resolved on-chain.")) {
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch("/api/contests/sync-status", {
        method: "POST",
      });

      const result = await res.json();

      if (res.ok) {
        alert(
          `✅ Sync complete!\n\n${result.synced} contests updated\n\n${result.results?.map((r: any) => `#${r.contestId}: ${r.status}`).join("\n") || ""}`
        );
        fetchContests();
      } else {
        alert(`Error: ${result.error || "Failed to sync"}`);
      }
    } catch (error: any) {
      alert(`Network error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSimulate(contestId: string) {
    setSimulating((prev) => ({ ...prev, [contestId]: true }));
    
    try {
      const res = await fetch("/api/contests/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId }),
      });

      const result = await res.json();

      if (res.ok) {
        setSimulationResults((prev) => ({ ...prev, [contestId]: result }));
        setShowSimulation((prev) => ({ ...prev, [contestId]: true }));
      } else {
        alert(`Simulation failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Network error: ${error.message}`);
    } finally {
      setSimulating((prev) => ({ ...prev, [contestId]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Active Contests</h1>
          <div className="flex gap-3">
            {contests.filter((c) => c.status === "OPEN" && new Date(c.deadline) < new Date()).length > 0 && (
              <button
                onClick={handleResolveAll}
                disabled={resolvingAll}
                className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black font-semibold py-3 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-5 h-5 ${resolvingAll ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {resolvingAll
                  ? "Resolving..."
                  : `⚡ Resolve All (${contests.filter((c) => c.status === "OPEN" && new Date(c.deadline) < new Date()).length})`}
              </button>
            )}
            <button
              onClick={handleSyncStatus}
              disabled={syncing}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded transition border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {syncing ? "Syncing..." : "🔄 Sync Status"}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded transition border border-neutral-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Contest
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 px-6 rounded font-semibold transition ${
              activeTab === "active"
                ? "bg-white text-black"
                : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-neutral-700"
            }`}
          >
            ⏳ Active Contests ({contests.filter(c => new Date(c.deadline) >= new Date()).length})
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 py-3 px-6 rounded font-semibold transition ${
              activeTab === "expired"
                ? "bg-white text-black"
                : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-neutral-700"
            }`}
          >
            ⏰ Expired Contests ({contests.filter(c => new Date(c.deadline) < new Date()).length})
          </button>
        </div>

        {/* Date Filter Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">📅 Filter by Date:</span>
            </div>
            
            <div className="flex-1 flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilterEnabled(true);
                }}
                className="bg-neutral-950 border border-neutral-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
              />
              
              {dateFilterEnabled && (
                <button
                  onClick={clearDateFilter}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded transition text-sm border border-neutral-700 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Filter
                </button>
              )}
              
              <div className="text-sm text-gray-400">
                {dateFilterEnabled ? (
                  <span>
                    Showing {filteredContests.length} {activeTab} contest{filteredContests.length !== 1 ? 's' : ''} from{' '}
                    {new Date(selectedDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span>Showing {filteredContests.length} {activeTab} contests</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => {
            const aiSuggestion = aiSuggestions[contest.id];
            const isOpen = contest.status === "OPEN";

            return (
              <div
                key={contest.id}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 hover:border-neutral-700 transition-all flex flex-col h-full"
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 font-mono text-xs">
                      #{contest.contest_id_onchain}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        isOpen
                          ? "bg-neutral-800 text-gray-300 border border-neutral-700"
                          : "bg-white text-black"
                      }`}
                    >
                      {contest.status}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-white line-clamp-3 min-h-[3.5rem]">
                    {contest.question}
                  </h2>
                </div>

                {/* Info */}
                <div className="text-xs text-gray-400 mb-4 space-y-1">
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span className="truncate">
                      Created: {new Date(contest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏰</span>
                    <span className="truncate">Deadline: {new Date(contest.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔧</span>
                    <span>ADMIN_ORACLE</span>
                  </div>
                </div>

                {/* AI Suggestion (compact) */}
                {isOpen && aiSuggestion && (
                  <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs text-gray-300 font-semibold">AI</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          aiSuggestion.suggested_outcome
                            ? "bg-white text-black"
                            : "bg-neutral-800 text-white"
                        }`}
                      >
                        {aiSuggestion.suggested_outcome ? "YES" : "NO"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{aiSuggestion.reasoning}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                )}

                {/* Resolved Outcome with Transparency */}
                {!isOpen && (
                  <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500 font-semibold">RESOLUTION</p>
                      <span
                        className={`text-base font-bold ${
                          contest.resolved_outcome ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {contest.resolved_outcome ? "✅ YES" : "❌ NO"}
                      </span>
                    </div>
                    
                    {/* Resolution Details */}
                    <div className="space-y-2 text-xs border-t border-neutral-800 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="text-gray-400 font-mono">AI Auto</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved:</span>
                        <span className="text-gray-400 font-mono">
                          {contest.resolved_at ? new Date(contest.resolved_at).toLocaleString() : "N/A"}
                        </span>
                      </div>
                      {contest.proof_uri && (
                        <div className="mt-2 pt-2 border-t border-neutral-800">
                          <p className="text-gray-600 mb-1">Reasoning:</p>
                          <p className="text-gray-400 text-xs line-clamp-2">{contest.proof_uri}</p>
                        </div>
                      )}
                      {aiSuggestion && (
                        <div className="mt-2 pt-2 border-t border-neutral-800">
                          <p className="text-gray-600 mb-1">Confidence:</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-neutral-900 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${aiSuggestion.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-gray-400 font-mono">
                              {(aiSuggestion.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution Form */}
                {isOpen && (
                  <div className="mt-auto border-t border-neutral-800 pt-4">
                    <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-1">
                      <span>⚖️</span> Resolve
                    </h3>

                    <input
                      type="text"
                      placeholder="Proof URI"
                      value={proofURIs[contest.id] || ""}
                      onChange={(e) =>
                        setProofURIs((prev) => ({ ...prev, [contest.id]: e.target.value }))
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-white"
                    />

                    <div className="space-y-2">
                      <button
                        onClick={() => handleQuickResolve(contest.id)}
                        disabled={loading[contest.id]}
                        className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-2 px-3 rounded transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                      >
                        {loading[contest.id] ? "⏳ Resolving..." : "⚡ Quick Resolve (Agent)"}
                      </button>
                      {aiSuggestion && (
                        <button
                          onClick={() => resolveAsAISuggests(contest.id)}
                          disabled={loading[contest.id]}
                          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-3 rounded transition disabled:opacity-50 text-sm"
                        >
                          {loading[contest.id] ? "⏳" : "🤖 AI Suggests"}
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleResolve(contest.id, true)}
                          disabled={loading[contest.id]}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-3 rounded transition disabled:opacity-50 text-sm border border-neutral-700"
                        >
                          ✅ YES
                        </button>
                        <button
                          onClick={() => handleResolve(contest.id, false)}
                          disabled={loading[contest.id]}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-3 rounded transition disabled:opacity-50 text-sm border border-neutral-700"
                        >
                          ❌ NO
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(dateFilterEnabled ? filteredContests : contests).length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              {dateFilterEnabled ? (
                <>
                  <p className="text-xl mb-2">📅 No contests found</p>
                  <p className="text-sm">No contests were created on {new Date(selectedDate).toLocaleDateString()}</p>
                  <button
                    onClick={clearDateFilter}
                    className="mt-4 text-white hover:text-gray-300 underline"
                  >
                    Clear filter to see all contests
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xl mb-2">📋 No contests yet</p>
                  <p className="text-sm">Create your first contest manually or from the Suggestions page!</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Manual Contest Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create Manual Contest</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewQuestion("");
                    setNewDeadline("");
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateManualContest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Contest Question *
                  </label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Will Bitcoin reach $100,000 by the end of 2026?"
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-white resize-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Enter a clear yes/no question that can be objectively verified
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Resolution Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded text-white focus:outline-none focus:border-white"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    When the contest should be resolved
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded p-3">
                  <p className="text-xs text-gray-400">
                    ⚠️ This will create a contest on-chain. Make sure all details are correct before submitting.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewQuestion("");
                      setNewDeadline("");
                    }}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-4 rounded transition border border-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-white hover:bg-gray-200 text-black font-semibold py-3 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create Contest"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
