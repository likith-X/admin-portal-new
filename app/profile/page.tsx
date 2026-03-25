"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Container from "@/app/components/ui/Container";
import { User, Trophy, Activity, Target, Bell, Zap, Settings, ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

export default function ProfilePage() {
  const [stats, setStats] = useState({
    totalContests: 0,
    totalVotes: 0,
    accuracy: 0,
  });

  useEffect(() => {
    setStats({ totalContests: 12, totalVotes: 45, accuracy: 78.5 });
  }, []);

  return (
    <main className="min-h-screen py-8 pb-32" style={{ background: 'var(--surface-lowest)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[180px] opacity-[0.02]" style={{ background: 'var(--secondary-container)' }} />
      </div>

      <Container className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1" style={{ color: 'var(--on-surface)' }}>
            Profile & Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--on-surface-dim)' }}>
            Manage your account and view your performance stats.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* User Info Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card-surface p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <User className="w-32 h-32" style={{ color: 'var(--primary)' }} />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))', boxShadow: 'var(--shadow-glow-primary)' }}>
                  <span className="font-bold text-xl" style={{ color: 'var(--surface-lowest)' }}>AH</span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold mb-0.5" style={{ color: 'var(--on-surface)' }}>Admin User</h2>
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--primary)' }}>admin@agentherald.com</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{
                      background: 'rgba(79, 242, 255, 0.06)', color: 'var(--primary)', border: '1px solid rgba(79, 242, 255, 0.12)'
                    }}>Administrator</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{
                      background: 'rgba(52, 211, 153, 0.06)', color: 'var(--success)', border: '1px solid rgba(52, 211, 153, 0.12)'
                    }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div initial="hidden" animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Trophy} label="Contests" value={stats.totalContests} accentColor="var(--warning)" progress={60} />
              <StatCard icon={Activity} label="Votes" value={stats.totalVotes} accentColor="var(--secondary-container)" progress={45} />
              <StatCard icon={Target} label="Accuracy" value={`${stats.accuracy}%`} accentColor="var(--primary)" progress={78} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="card-surface p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(133, 147, 153, 0.06)' }}>
                  <Settings className="w-4 h-4" style={{ color: 'var(--on-surface-dim)' }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>Platform Settings</h3>
              </div>

              <div className="space-y-5">
                <SettingToggle icon={Bell} iconColor="var(--secondary)" label="Notifications" description="Receive email updates about contest resolutions." enabled={true} />
                <div className="h-px" style={{ background: 'var(--ghost-border)' }} />
                <SettingToggle icon={Zap} iconColor="var(--warning)" label="Auto-Resolve" description="Automatically finalize contests after the deadline passes." enabled={true} />
              </div>
            </motion.div>

            {/* Pro Tip */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl p-5" style={{
                background: 'rgba(79, 242, 255, 0.02)',
                border: '1px solid rgba(79, 242, 255, 0.08)',
              }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--primary)' }}>Pro Tip</h4>
              <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--on-surface-dim)' }}>
                Connect your Farcaster account to automatically syndicate new contests to your followers.
              </p>
              <button className="w-full py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(79, 242, 255, 0.05)', color: 'var(--primary)', border: '1px solid rgba(79, 242, 255, 0.12)' }}>
                <ExternalLink className="w-3 h-3" />
                Connect Farcaster
              </button>
            </motion.div>
          </div>
        </div>
      </Container>
    </main>
  );
}

/* Sub-components */

function StatCard({ icon: Icon, label, value, accentColor, progress }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number;
  accentColor: string; progress: number;
}) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }}
      className="group card-surface p-5 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `color-mix(in srgb, ${accentColor} 8%, transparent)` }}>
        <Icon className="w-6 h-6" style={{ color: accentColor }} />
      </div>
      <p className="label-micro mb-2">{label}</p>
      <p className="text-3xl font-bold font-mono mb-3" style={{ color: 'var(--on-surface)' }}>{value}</p>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-low)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: accentColor }} />
      </div>
    </motion.div>
  );
}

function SettingToggle({ icon: Icon, iconColor, label, description, enabled }: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string; label: string; description: string; enabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
          {label}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--on-surface-dim)' }}>{description}</p>
      </div>
      <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none" style={{
        background: enabled ? 'var(--primary-dim)' : 'var(--surface-bright)',
      }}>
        <span className="inline-block h-4 w-4 transform rounded-full transition-transform" style={{
          transform: enabled ? 'translateX(24px)' : 'translateX(4px)',
          background: enabled ? 'var(--surface-lowest)' : 'var(--on-surface-muted)',
        }} />
      </button>
    </div>
  );
}
