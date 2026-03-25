"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        setSuccess(true);
        // If email confirmation is disabled, user is auto logged in
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-3xl tracking-tight">AH</span>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 tracking-tight">Agent Herald</h1>
            <p className="text-blue-200/60 text-sm font-medium tracking-wide">
              CREATE ADMIN ACCOUNT
            </p>
          </Link>
        </div>

        {/* Signup Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Join the Platform</h2>
            <p className="text-sm text-gray-400">Create your admin credentials securely.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-200 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Account created successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all duration-200"
                placeholder="admin@agentherald.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Confirm
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <p className="text-xs text-center text-gray-500 px-4">
              By creating an account, you agree to the <a href="#" className="underline hover:text-gray-400">Terms of Service</a>.
            </p>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : success ? "Success!" : "Request Access"}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-xs uppercase tracking-wider font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
