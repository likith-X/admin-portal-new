"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-6xl font-bold text-white mb-6 tracking-tight">
            AI-Powered Prediction Market
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Create, manage, and resolve prediction contests with blockchain
            transparency and AI-assisted decision making.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center space-x-4 mb-16">
            <Link
              href="/suggestions"
              className="px-8 py-4 bg-white text-black rounded hover:bg-gray-200 font-semibold text-lg transition-colors"
            >
              View Suggestions →
            </Link>
            <Link
              href="/contests"
              className="px-8 py-4 bg-neutral-900 text-white border-2 border-neutral-700 rounded hover:bg-neutral-800 font-semibold text-lg transition-colors"
            >
              Browse Contests
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg hover:border-neutral-700 transition-colors">
              <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                AI-Generated Questions
              </h3>
              <p className="text-gray-400">
                Automatically analyze news articles and generate verifiable
                prediction questions.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg hover:border-neutral-700 transition-colors">
              <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Blockchain Verified
              </h3>
              <p className="text-gray-400">
                All contests are created and resolved on Base Mainnet for
                immutable transparency.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg hover:border-neutral-700 transition-colors">
              <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Oracle Resolution
              </h3>
              <p className="text-gray-400">
                AI-assisted resolution with admin oversight for accurate and
                fair outcomes.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 bg-neutral-900 border border-neutral-800 rounded-lg p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-white mb-2">
                  On-Chain
                </div>
                <div className="text-gray-400">Contest Storage</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">
                  AI-Powered
                </div>
                <div className="text-gray-400">Question Generation</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">
                  Base Mainnet
                </div>
                <div className="text-gray-400">Network</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>© 2025 Agent Herald. Built with Next.js, Supabase, and ethers.js</p>
            <p className="text-sm mt-2 text-gray-600">
              Contract: 0xCC0C4E89F5C857FD98769d7eB03321E59F4d22F9
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
