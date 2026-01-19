// app/suggestions/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SuggestionRow = {
  id: string;
  article_id: string;
  headline: string;
  summary: string;
  yes_no_question: string;
  resolution_criteria: string;
  score_relevance: number;
  created_at: string;
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [approvingAll, setApprovingAll] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const res = await fetch("/api/suggestions");
      const data = await res.json();
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoading(false);
    }
  }

  // Sort suggestions based on created_at date
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  async function fetchNewSuggestions() {
    if (!confirm("Fetch new contest suggestions from news sources?")) {
      return;
    }

    setFetching(true);
    try {
      console.log("Calling /api/suggestions/fetch...");
      const res = await fetch("/api/suggestions/fetch", {
        method: "POST",
      });

      console.log("Response status:", res.status);
      const result = await res.json();
      console.log("Response data:", result);

      if (res.ok) {
        if (result.errors && result.errors.length > 0) {
          alert(`⚠️ Fetched ${result.count} suggestions with errors:\n${result.errors.join('\n')}`);
        } else {
          alert(`✅ Fetched ${result.count} new suggestions!`);
        }
        loadSuggestions();
      } else {
        alert(`Error: ${result.error || result.message || "Failed to fetch suggestions"}`);
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      alert(`Network error: ${error.message}`);
    } finally {
      setFetching(false);
    }
  }

  async function handleApprove(suggestionId: string) {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/approve`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Contest created successfully!");
        loadSuggestions();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to approve"}`);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  }

  async function handleReject(suggestionId: string) {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/reject`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Suggestion rejected.");
        loadSuggestions();
      } else {
        alert("Failed to reject");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  }

  async function handleApproveAll() {
    if (suggestions.length === 0) {
      alert("No suggestions to approve");
      return;
    }

    if (!confirm(`Approve all ${suggestions.length} suggestions and create contests on-chain?\n\nThis will:\n- Create ${suggestions.length} on-chain contests\n- Cost gas fees for each transaction\n- Make them visible in the mobile app`)) {
      return;
    }

    setApprovingAll(true);
    try {
      const res = await fetch("/api/suggestions/approve-all", {
        method: "POST",
      });

      const result = await res.json();

      if (res.ok) {
        if (result.errors && result.errors.length > 0) {
          alert(
            `✅ Created ${result.count} contests!\n\n⚠️ ${result.errors.length} failed:\n${result.errors.map((e: any) => `- ${e.question}`).join('\n')}`
          );
        } else {
          alert(`✅ Successfully created ${result.count} contests!\n\nThey are now visible in the mobile app.`);
        }
        loadSuggestions();
      } else {
        alert(`Error: ${result.error || "Failed to approve all suggestions"}`);
      }
    } catch (error: any) {
      alert(`Network error: ${error.message}`);
    } finally {
      setApprovingAll(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Contest Suggestions</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pending: {suggestions.length}
            </p>
          </div>

          <div className="flex gap-3">
            {suggestions.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={approvingAll}
                className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black font-semibold py-3 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-5 h-5 ${approvingAll ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {approvingAll ? `Approving ${suggestions.length}...` : `✨ Approve All (${suggestions.length})`}
              </button>
            )}
            
            <button
              onClick={fetchNewSuggestions}
              disabled={fetching}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-700"
            >
              <svg
                className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {fetching ? "Fetching..." : "Fetch New"}
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        {!loading && suggestions.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">🗂️ Sort by:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder("newest")}
                  className={`px-4 py-2 rounded text-sm font-semibold transition ${
                    sortOrder === "newest"
                      ? "bg-white text-black"
                      : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 border border-neutral-700"
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortOrder("oldest")}
                  className={`px-4 py-2 rounded text-sm font-semibold transition ${
                    sortOrder === "oldest"
                      ? "bg-white text-black"
                      : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 border border-neutral-700"
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Information Panel */}
        {!loading && suggestions.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">How It Works</h3>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    <strong className="text-gray-300">Individual Approve:</strong> Click "✅ Approve & Create Contest" on any suggestion to create a single on-chain contest.
                  </p>
                  <p>
                    <strong className="text-gray-300">Bulk Approve:</strong> Click "✨ Approve All" to create on-chain contests for all {suggestions.length} pending suggestions at once.
                  </p>
                  <p>
                    <strong className="text-gray-300">Mobile Visibility:</strong> Once approved, contests appear immediately in the mobile app for users to vote on.
                  </p>
                </div>
                <div className="mt-3 bg-neutral-950 border border-neutral-800 rounded p-3">
                  <p className="text-xs text-gray-500">
                    ⚠️ <strong className="text-gray-400">Note:</strong> Each approval creates an on-chain transaction and requires gas fees. Bulk approval is more efficient for multiple suggestions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Loading suggestions...</p>
          </div>
        )}

        {!loading && suggestions.length === 0 && (
          <div className="text-center py-12 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-gray-400">No pending suggestions right now.</p>
            <p className="text-gray-600 text-sm mt-2">
              Click "Fetch New Suggestions" to generate from news sources
            </p>
          </div>
        )}

        <div className="space-y-3">
          {sortedSuggestions.map((s) => (
            <div
              key={s.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all"
            >
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="flex-1">
                  <h2 className="font-semibold text-white text-base mb-1">{s.headline}</h2>
                  <p className="text-xs text-gray-500 font-mono">
                    📅 {new Date(s.created_at).toLocaleDateString()} • {new Date(s.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-xs bg-neutral-800 text-gray-300 px-2 py-1 rounded border border-neutral-700 font-mono">
                  {s.score_relevance.toFixed(2)}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{s.summary}</p>

              <div className="mb-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                <p className="text-xs font-medium text-gray-500 mb-1">Question:</p>
                <p className="text-sm text-white">{s.yes_no_question}</p>
              </div>

              <div className="mb-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                <p className="text-xs font-medium text-gray-500 mb-1">Resolution criteria:</p>
                <p className="text-xs text-gray-400 line-clamp-2">{s.resolution_criteria}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(s.id)}
                  className="flex-1 bg-white hover:bg-gray-200 text-black font-semibold py-2 px-4 rounded transition text-sm"
                >
                  ✅ Approve
                </button>

                <button
                  onClick={() => handleReject(s.id)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded transition border border-neutral-700 text-sm"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}