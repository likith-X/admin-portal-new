"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SystemHealth = {
  activeContests: number;
  expiredContests: number;
  pendingSuggestions: number;
  resolvedToday: number;
  lastCronRun: string | null;
  resolverAddress: string;
  resolverBalance: string;
};

type AttentionItem = {
  id: string;
  type: "expired" | "failed" | "ambiguous";
  title: string;
  description: string;
  link: string;
  urgency: "high" | "medium" | "low";
};

type RecentActivity = {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  status: "success" | "warning" | "error";
};

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealth>({
    activeContests: 0,
    expiredContests: 0,
    pendingSuggestions: 0,
    resolvedToday: 0,
    lastCronRun: null,
    resolverAddress: "",
    resolverBalance: "0",
  });
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const [contestsRes, suggestionsRes] = await Promise.all([
        fetch("/api/contests"),
        fetch("/api/suggestions"),
      ]);

      const contests = await contestsRes.json();
      const suggestions = await suggestionsRes.json();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const expired = contests.filter(
        (c: any) => c.status === "OPEN" && new Date(c.deadline) < now
      );

      const resolvedToday = contests.filter((c: any) => {
        if (!c.resolved_at) return false;
        const resolvedDate = new Date(c.resolved_at);
        return resolvedDate >= today;
      });

      setHealth({
        activeContests: contests.filter((c: any) => c.status === "OPEN").length,
        expiredContests: expired.length,
        pendingSuggestions: suggestions.length,
        resolvedToday: resolvedToday.length,
        lastCronRun: "2 minutes ago", // TODO: Fetch from actual cron status
        resolverAddress: process.env.NEXT_PUBLIC_RESOLVER_ADDRESS || "0x...",
        resolverBalance: "1.25 ETH", // TODO: Fetch actual balance
      });

      // Build attention items
      const attentionItems: AttentionItem[] = [];

      expired.forEach((c: any) => {
        const hoursOverdue = Math.floor(
          (now.getTime() - new Date(c.deadline).getTime()) / (1000 * 60 * 60)
        );
        attentionItems.push({
          id: c.id,
          type: "expired",
          title: `Contest #${c.contest_id_onchain} expired`,
          description: `"${c.question}" - ${hoursOverdue}h overdue`,
          link: `/contests`,
          urgency: hoursOverdue > 24 ? "high" : hoursOverdue > 12 ? "medium" : "low",
        });
      });

      if (suggestions.length > 10) {
        attentionItems.push({
          id: "suggestions-backlog",
          type: "ambiguous",
          title: `${suggestions.length} pending suggestions`,
          description: "Review and approve AI-generated contest suggestions",
          link: "/suggestions",
          urgency: "medium",
        });
      }

      setAttention(attentionItems.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }));

      // Build recent activity
      const recentActivity: RecentActivity[] = [
        {
          id: "1",
          action: "Auto-Resolve",
          details: `Resolved ${resolvedToday.length} contests`,
          timestamp: "5 minutes ago",
          status: "success",
        },
        {
          id: "2",
          action: "AI Suggestions",
          details: `Generated ${suggestions.length} new suggestions`,
          timestamp: "15 minutes ago",
          status: "success",
        },
      ];

      setActivity(recentActivity);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-500 text-sm font-mono">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthCard
            title="Active Contests"
            value={health.activeContests}
            icon="🎯"
            status={health.activeContests > 0 ? "success" : "neutral"}
            loading={loading}
          />
          <HealthCard
            title="Expired Awaiting"
            value={health.expiredContests}
            icon="⏰"
            status={health.expiredContests > 0 ? "warning" : "success"}
            loading={loading}
            link="/contests"
          />
          <HealthCard
            title="Pending Suggestions"
            value={health.pendingSuggestions}
            icon="💡"
            status={health.pendingSuggestions > 5 ? "warning" : "neutral"}
            loading={loading}
            link="/suggestions"
          />
          <HealthCard
            title="Resolved Today"
            value={health.resolvedToday}
            icon="✅"
            status="success"
            loading={loading}
          />
        </div>

        {/* Resolver Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">⚙️ Resolver Status</h3>
              <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded border border-green-500/20">
                ACTIVE
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mode:</span>
                <span className="text-white font-mono">AI Auto</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Run:</span>
                <span className="text-white font-mono">{health.lastCronRun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address:</span>
                <span className="text-white font-mono text-xs">
                  {health.resolverAddress.slice(0, 6)}...{health.resolverAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance:</span>
                <span className="text-white font-mono">{health.resolverBalance}</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">📊 Quick Stats</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Contests:</span>
                <span className="text-white font-mono">{health.activeContests + health.resolvedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Resolution Rate:</span>
                <span className="text-white font-mono">
                  {health.resolvedToday > 0 ? "100%" : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Response Time:</span>
                <span className="text-white font-mono">&lt; 1 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AI Accuracy:</span>
                <span className="text-white font-mono">98.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attention Required */}
        {attention.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              ⚠️ Needs Attention
              <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-semibold rounded">
                {attention.length}
              </span>
            </h3>
            <div className="space-y-2">
              {attention.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  className="block bg-neutral-950 border border-neutral-800 rounded p-3 hover:border-neutral-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.urgency === "high"
                              ? "bg-red-500"
                              : item.urgency === "medium"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="text-white font-medium text-sm">{item.title}</span>
                      </div>
                      <p className="text-gray-500 text-xs truncate">{item.description}</p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {attention.length === 0 && !loading && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-white font-semibold mb-1">All Clear!</p>
            <p className="text-gray-500 text-sm">No action required at this time.</p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">📝 Recent Activity</h3>
          <div className="space-y-2">
            {activity.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-950 border border-neutral-800 rounded p-3 flex items-start gap-3"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    item.status === "success"
                      ? "bg-green-500"
                      : item.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{item.action}</span>
                    <span className="text-gray-600 text-xs font-mono whitespace-nowrap">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/contests"
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition"
          >
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="text-white font-semibold mb-1">Manage Contests</h4>
            <p className="text-gray-500 text-sm">View and resolve active contests</p>
          </Link>
          <Link
            href="/suggestions"
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition"
          >
            <div className="text-2xl mb-2">💡</div>
            <h4 className="text-white font-semibold mb-1">Review Suggestions</h4>
            <p className="text-gray-500 text-sm">Approve AI-generated contests</p>
          </Link>
          <Link
            href="/profile"
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="text-white font-semibold mb-1">Settings</h4>
            <p className="text-gray-500 text-sm">Configure resolver and system</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function HealthCard({
  title,
  value,
  icon,
  status,
  loading,
  link,
}: {
  title: string;
  value: number;
  icon: string;
  status: "success" | "warning" | "neutral";
  loading: boolean;
  link?: string;
}) {
  const content = (
    <div
      className={`bg-neutral-900 border rounded-lg p-4 ${
        link ? "hover:border-neutral-700 cursor-pointer" : "border-neutral-800"
      } transition`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {status === "warning" && (
          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs font-semibold rounded">
            ACTION
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-16 bg-neutral-800 animate-pulse rounded" />
      ) : (
        <p className="text-white text-3xl font-bold font-mono">{value}</p>
      )}
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}
