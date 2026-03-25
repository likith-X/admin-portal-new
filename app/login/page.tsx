"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const input = code.trim().toUpperCase();
      
      // 1. Query the database for a valid invite code
      const { data: invite, error: dbError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', input)
        .single();

      if (dbError || !invite) {
        throw new Error("Invalid access hash. Connection severed.");
      }

      // 2. Validate availability
      const now = new Date().toISOString();
      if (invite.expires_at && invite.expires_at < now) {
        throw new Error("Access hash expired. Contact HQ for rotation.");
      }

      if (invite.max_uses && invite.uses >= invite.max_uses) {
         throw new Error("Access limit reached for this hash.");
      }

      // 3. (Optional) Increment use counter
      await supabase
        .from('invites')
        .update({ uses: invite.uses + 1 })
        .eq('id', invite.id);

      // 4. Grant access
      document.cookie = `ah_admin_invite_token=${invite.id}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 day access
      
      // Artificial delay for brutalist UX feeling
      setTimeout(() => {
        router.push("/");
      }, 800);

    } catch (err: any) {
      setError(err.message || "Credential verification failure.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-white text-[#111111] font-sans selection:bg-[#ccff00] selection:text-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 border-2 border-black shadow-[12px_12px_0_0_#ccff00] bg-white relative mx-6"
      >
        <div className="absolute -top-6 -left-6 w-12 h-12 bg-black flex items-center justify-center">
          <Hexagon className="w-6 h-6 text-white" />
        </div>

        <h1 className="font-display font-bold text-4xl tracking-tight mb-2 mt-4">Restricted.</h1>
        <p className="font-mono text-[11px] uppercase tracking-widest text-black/50 mb-8 leading-relaxed">
          AgentHerald Operating System v2.0 <br />
          Network nodes are invite-only.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3 h-3" /> Insert Invite Hash / Code
            </label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. INVITE-XXXX"
              required
              className="w-full bg-[#f0f0f0] border-0 outline-none p-4 font-mono text-sm uppercase focus:ring-2 focus:ring-[#ccff00] transition-shadow placeholder:normal-case placeholder:text-black/30"
            />
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[10px] uppercase tracking-widest text-red-500 mt-2">
                {error}
              </motion.div>
            )}
            <div className="font-mono text-[9px] text-black/40 mt-4 border-l border-black/20 pl-2">
              SYS-HINT: Use <strong className="text-black">AH-ROOT</strong> for admin bypass validation.
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black hover:bg-[#ccff00] text-white hover:text-black transition-colors p-4 font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Identity"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
