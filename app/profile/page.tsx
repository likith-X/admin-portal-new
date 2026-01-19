"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [stats, setStats] = useState({
    totalContests: 0,
    totalVotes: 0,
    accuracy: 0,
  });

  useEffect(() => {
    // Placeholder - you can fetch real user stats here
    setStats({
      totalContests: 12,
      totalVotes: 45,
      accuracy: 78.5,
    });
  }, []);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-8">Profile</h1>

        {/* User Info Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin User</h2>
              <p className="text-gray-400">admin@agentherald.com</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">Total Contests</p>
              <p className="text-white text-3xl font-bold">{stats.totalContests}</p>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">Total Votes</p>
              <p className="text-white text-3xl font-bold">{stats.totalVotes}</p>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">Accuracy</p>
              <p className="text-white text-3xl font-bold">{stats.accuracy}%</p>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-500 text-sm">Receive updates about contest resolutions</p>
              </div>
              <button className="bg-white text-black px-4 py-2 rounded font-semibold hover:bg-gray-200 transition">
                Enable
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-Resolve</p>
                <p className="text-gray-500 text-sm">Automatically resolve contests after deadline</p>
              </div>
              <button className="bg-neutral-800 text-white px-4 py-2 rounded font-semibold hover:bg-neutral-700 transition border border-neutral-700">
                Enabled
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
