"use client";

import { useState, useEffect } from "react";
import Container from "@/app/components/ui/Container";
import EditorialLayout from "@/app/components/EditorialLayout";
import AnimatedCard from "@/app/components/AnimatedCard";
import AnimatedButton from "@/app/components/AnimatedButton";
import { toast } from "sonner";

interface TestContest {
  id: string;
  contest_id_onchain: string | null;
  question: string;
  status: string;
  is_test: boolean;
  created_at: string;
  resolved: boolean;
}

export default function TestLabPage() {
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState<TestContest[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newHeadline, setNewHeadline] = useState("🧪 LAB TEST");

  useEffect(() => {
    fetchTestContests();
  }, []);

  const fetchTestContests = async () => {
    try {
      // Fetch all contests to ensure the Manual Resolution center 
      // can act as an oracle for any market currently in testing
      const response = await fetch("/api/contests?status=OPEN");
      const data = await response.json();
      setContests(data || []); // API returns a raw array
    } catch (err) {
      console.error("Failed to fetch test contests", err);
    }
  };

  const createTestContest = async () => {
    if (!newQuestion) return;
    setLoading(true);
    try {
      // Create a direct contest on-chain for testing
      const response = await fetch("/api/contests/create-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestion,
          headline: newHeadline,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`🧪 Test Market Created! (#${data.contestId})`);
        setNewQuestion("");
        fetchTestContests();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const manualResolve = async (contestId: string, choice: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contests/${contestId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          outcome: choice === 1, 
          proofURI: "LAB_TEST_MANUAL" 
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`📢 Market #${contestId} Resolved to ${choice === 1 ? 'YES' : 'NO'}`);
        fetchTestContests();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(`Resolution Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 relative">
      <Container className="flex flex-col gap-10">
        <header className="mb-16 pb-8 border-b-4 border-black">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-6xl font-black flex items-center gap-4 uppercase tracking-tighter leading-none">
                Lab <span className="text-[#ccff00] bg-black px-4 py-1">Sim</span>
              </h1>
              <p className="text-black font-mono text-[10px] uppercase tracking-[0.2em] mt-6 max-w-2xl leading-relaxed">
                Autonomous node simulation chamber. Trigger and resolve experimental protocols to validate the Agent Herald ecosystem.
              </p>
            </div>
            <div className="hidden lg:block text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.5em] text-black/30">Node Registry</div>
              <div className="text-xs font-bold font-mono text-green-600 uppercase">● Live Simulation Active</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Creation Panel */}
          <AnimatedCard className="p-8 border-2 border-black shadow-[12px_12px_0px_0px_#ccff00] bg-white text-black">
            <h2 className="text-3xl font-bold mb-6 uppercase tracking-tighter">1. Create Lab Simulation</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-mono mb-2 uppercase font-bold tracking-[0.2em] text-black/50">Question (Outcome Indicator)</label>
                <textarea 
                  className="w-full bg-[#f8f8f8] border-2 border-black p-4 font-mono text-sm focus:bg-white transition-colors outline-none"
                  placeholder="e.g., Will the mobile node trigger a resolution notification?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={4}
                />
              </div>
              <AnimatedButton 
                className="w-full bg-black text-[#ccff00] font-bold h-14 text-sm tracking-widest uppercase hover:bg-[#ccff00] hover:text-black border-2 border-black"
                onClick={createTestContest}
                disabled={loading || !newQuestion}
              >
                {loading ? "INITIALIZING NODE..." : "🚀 LAUNCH TEST MARKET"}
              </AnimatedButton>
            </div>
          </AnimatedCard>
  
          {/* Control Panel */}
          <AnimatedCard className="p-8 border-2 border-black bg-white h-[600px] flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] text-black">
            <h2 className="text-3xl font-bold mb-6 uppercase tracking-tighter">2. Manual Resolution Center</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              {contests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-black/10 text-black/20 font-mono text-center p-10">
                  <div className="text-4xl mb-4 opacity-20">📡</div>
                  <div className="text-[10px] uppercase tracking-[0.3em]">No active lab experiments discovered in local ledger...</div>
                </div>
              ) : contests.map(contest => (
                <div key={contest.id} className="border-2 border-black p-5 bg-white hover:bg-[#fafafa] transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-black text-[#ccff00] px-3 py-1 text-[10px] font-mono font-bold">NODE_{contest.id}</span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${contest.status === 'RESOLVED' ? 'text-green-600' : 'text-orange-500'}`}>
                      {contest.status}
                    </span>
                  </div>
                  <p className="font-bold text-base mb-6 leading-tight tracking-tight">{contest.question}</p>
                  
                  {contest.status === 'RESOLVED' ? (
                    <div className="flex items-center gap-3 py-3 px-4 bg-black text-[#ccff00] text-xs font-mono font-bold uppercase tracking-widest">
                      <div className="w-2 h-2 bg-[#ccff00] rounded-full animate-pulse" />
                      State Resolution Complete
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => manualResolve(contest.id, 1)}
                        disabled={loading}
                        className="bg-white hover:bg-black hover:text-[#ccff00] border-2 border-black p-3 text-xs font-bold transition-all uppercase tracking-widest"
                      >
                        SET YES
                      </button>
                      <button 
                        onClick={() => manualResolve(contest.id, 2)}
                        disabled={loading}
                        className="bg-white hover:bg-black hover:text-[#ccff00] border-2 border-black p-3 text-xs font-bold transition-all uppercase tracking-widest"
                      >
                        SET NO
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AnimatedCard>
  
        </div>
      </Container>
    </div>
  );
}
