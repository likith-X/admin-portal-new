"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/app/components/ui/Container";
import {
  Target, Clock, Lightbulb, CheckCircle2, Zap,
  Activity, AlertCircle, ArrowUpRight, Wallet, PlayCircle,
  RefreshCcw, LucideIcon
} from "lucide-react";
import AnimatedCounter from "@/app/components/AnimatedCounter";

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

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const } },
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
        lastCronRun: "2 minutes ago",
        resolverAddress: process.env.NEXT_PUBLIC_RESOLVER_ADDRESS || "0x...",
        resolverBalance: "1.25 ETH",
      });

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
    <main className="min-h-screen pt-6 md:pt-8 pb-32 relative" style={{ background: 'var(--surface-lowest)' }}>
      {/* Subtle Ambient Glow — Not Distracting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.04]" style={{ background: 'var(--secondary-container)' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[200px] opacity-[0.03]" style={{ background: 'var(--primary)' }} />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col gap-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-5"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Dashboard
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono" style={{ color: 'var(--on-surface-muted)' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="w-px h-3" style={{ background: 'var(--surface-bright)' }} />
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Operational</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/suggestions"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--surface-high)', color: 'var(--on-surface)', border: '1px solid var(--ghost-border)' }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--tertiary-container)' }} />
                Suggestions
              </Link>
              <Link
                href="/contests"
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Target className="w-4 h-4" />
                Manage Contests
              </Link>
            </div>
          </motion.div>

          {/* Metric Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <MetricCard title="Active Contests" value={health.activeContests} icon={Target} accentColor="var(--primary)" status={health.activeContests > 0 ? "active" : "neutral"} loading={loading} />
            <MetricCard title="Expired Awaiting" value={health.expiredContests} icon={Clock} accentColor="var(--warning)" status={health.expiredContests > 0 ? "warning" : "success"} loading={loading} link="/contests" />
            <MetricCard title="Pending Suggestions" value={health.pendingSuggestions} icon={Lightbulb} accentColor="var(--tertiary-container)" status={health.pendingSuggestions > 5 ? "warning" : "neutral"} loading={loading} link="/suggestions" />
            <MetricCard title="Resolved Today" value={health.resolvedToday} icon={CheckCircle2} accentColor="var(--success)" status="success" loading={loading} />
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="xl:col-span-8 flex flex-col gap-6 min-w-0">
              {/* Resolver Status */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="card-surface p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold flex items-center gap-2.5" style={{ color: 'var(--on-surface)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79, 242, 255, 0.08)' }}>
                      <Zap className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    </div>
                    Resolver Status
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(79, 242, 255, 0.06)', color: 'var(--primary)', border: '1px solid rgba(79, 242, 255, 0.12)' }}>
                    <PlayCircle className="w-3 h-3" />
                    AI Auto-Pilot
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <ResolverMiniCard
                    label="Contract Balance"
                    value={health.resolverBalance}
                    accentColor="var(--success)"
                    isHighlight
                  />
                  <ResolverMiniCard label="Executor Address" value={health.resolverAddress || "Loading..."} icon={Wallet} truncate />
                  <ResolverMiniCard
                    label="Status / Mode"
                    customValue={
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--success)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
                        Active Auto-Pilot
                      </span>
                    }
                    icon={Activity}
                  />
                  <ResolverMiniCard label="Last Run" value={health.lastCronRun || "..."} icon={Clock} />
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="card-surface p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold flex items-center gap-2.5" style={{ color: 'var(--on-surface)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(204, 182, 255, 0.08)' }}>
                      <Activity className="w-4 h-4" style={{ color: 'var(--tertiary-container)' }} />
                    </div>
                    Recent Activity
                  </h3>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {activity.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ delay: index * 0.08 }}
                        className="group rounded-xl p-4 transition-all duration-200"
                        style={{ background: 'var(--surface-low)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-container)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-low)'; }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 relative flex-shrink-0">
                            <span className={`block w-2 h-2 rounded-full ${
                              item.status === "success" ? "bg-emerald-400" :
                              item.status === "warning" ? "bg-amber-400" : "bg-red-400"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                                {item.action}
                              </span>
                              <span className="text-[11px] font-mono whitespace-nowrap" style={{ color: 'var(--on-surface-muted)' }}>
                                {item.timestamp}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--on-surface-dim)' }}>{item.details}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {activity.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" style={{ background: 'var(--surface-low)' }}>
                        <Activity className="w-5 h-5" style={{ color: 'var(--on-surface-muted)' }} />
                      </div>
                      <p className="text-sm" style={{ color: 'var(--on-surface-muted)' }}>No recent activity</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Needs Attention */}
            <div className="xl:col-span-4 min-w-0 xl:sticky xl:top-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card-surface p-5 flex flex-col max-h-[70vh] xl:max-h-[calc(100vh-80px)]"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                    Needs Attention
                  </h3>
                  <AnimatePresence>
                    {attention.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                        style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--error)', border: '1px solid rgba(248, 113, 113, 0.15)' }}
                      >
                        {attention.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="popLayout">
                  {attention.length > 0 ? (
                    <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                      {attention.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ delay: index * 0.04 }}
                        >
                          <Link
                            href={item.link}
                            className="block group rounded-xl p-4 transition-all duration-200 relative overflow-hidden"
                            style={{ background: 'var(--surface-low)', border: '1px solid var(--ghost-border)' }}
                          >
                            {/* Urgency indicator bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{
                              background: item.urgency === "high" ? 'var(--error)' :
                                item.urgency === "medium" ? 'var(--warning)' : '#eab308'
                            }} />

                            <div className="pl-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="label-micro">
                                  {item.type === "expired" ? item.title.replace(" expired", "") : item.title}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{
                                  background: item.type === "expired" ? 'rgba(248, 113, 113, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                                  color: item.type === "expired" ? 'var(--error)' : 'var(--warning)',
                                  border: `1px solid ${item.type === "expired" ? 'rgba(248, 113, 113, 0.12)' : 'rgba(251, 191, 36, 0.12)'}`,
                                }}>
                                  {item.type === "expired" ? "OVERDUE" : "NOTICE"}
                                </span>
                              </div>

                              <h2 className="text-sm font-semibold line-clamp-2 leading-snug mb-3 transition-colors" style={{ color: 'var(--on-surface)' }}>
                                {item.type === "expired"
                                  ? (item.description.includes(' - ') ? item.description.substring(0, item.description.lastIndexOf(' - ')).replace(/^"|"$/g, '') : item.description)
                                  : item.description}
                              </h2>

                              <div className="text-xs space-y-1.5 pt-2" style={{ borderTop: '1px solid var(--ghost-border)' }}>
                                {item.type === "expired" ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span style={{ color: 'var(--on-surface-muted)' }}>Auto-Resolve</span>
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--error)', background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.1)' }}>FAILED</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span style={{ color: 'var(--on-surface-muted)' }}>Time Expired</span>
                                      <span className={`font-mono font-medium ${item.urgency === "high" ? "animate-pulse" : ""}`} style={{ color: item.urgency === "high" ? 'var(--error)' : 'var(--warning)' }}>
                                        {item.description.includes(' - ') ? item.description.split(' - ').pop()?.replace(" overdue", "") : "Unknown"}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span style={{ color: 'var(--on-surface-muted)' }}>Action Required</span>
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--warning)', background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.1)' }}>REVIEW</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 flex-1 flex flex-col items-center justify-center"
                    >
                      <div className="text-4xl mb-3">✨</div>
                      <p className="text-sm font-medium" style={{ color: 'var(--on-surface-dim)' }}>All caught up!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

/* =============================================
   SUB-COMPONENTS
   ============================================= */

function MetricCard({
  title, value, icon: Icon, accentColor, status, loading, link,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  accentColor: string;
  status: "active" | "success" | "warning" | "neutral";
  loading: boolean;
  link?: string;
}) {
  const content = (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative rounded-2xl p-5 transition-all duration-300 overflow-hidden ${link ? "cursor-pointer" : ""}`}
      style={{ background: 'var(--surface-container)', border: '1px solid var(--ghost-border)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--ghost-border-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--ghost-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${accentColor} 8%, transparent)` }}>
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          {status === "warning" && (
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--warning)', boxShadow: '0 0 6px rgba(251, 191, 36, 0.4)' }} />
          )}
          {status === "success" && value > 0 && (
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)', boxShadow: '0 0 6px rgba(52, 211, 153, 0.4)' }} />
          )}
        </div>

        <div>
          <p className="label-micro mb-1.5">{title}</p>
          {loading ? (
            <div className="h-9 w-16 rounded-lg animate-pulse" style={{ background: 'var(--surface-high)' }} />
          ) : (
            <div className="flex items-baseline gap-2">
              <AnimatedCounter
                to={value}
                className="text-3xl font-bold font-mono tracking-tight"
                style={{ color: 'var(--on-surface)' }}
              />
              {link && (
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" style={{ color: 'var(--on-surface-dim)' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

function ResolverMiniCard({
  label, value, icon: Icon, accentColor, isHighlight, truncate, customValue,
}: {
  label: string;
  value?: string;
  icon?: LucideIcon;
  accentColor?: string;
  isHighlight?: boolean;
  truncate?: boolean;
  customValue?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col justify-center"
      style={{
        background: isHighlight ? 'rgba(52, 211, 153, 0.04)' : 'var(--surface-low)',
        border: `1px solid ${isHighlight ? 'rgba(52, 211, 153, 0.1)' : 'var(--ghost-border)'}`,
      }}
    >
      <p className="label-micro mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" style={{ color: 'var(--on-surface-muted)' }} />}
        {label}
      </p>
      {customValue ? customValue : (
        <p className={`font-mono text-sm font-semibold ${truncate ? "truncate" : ""}`}
          style={{ color: isHighlight && accentColor ? accentColor : 'var(--on-surface)' }}
        >
          {value}
        </p>
      )}
    </div>
  );
}
