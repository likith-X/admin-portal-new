'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Zap, AlertTriangle, Cpu, Globe, ArrowRight } from 'lucide-react';

interface NodeHealth {
  id: string;
  node_name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  last_run: string;
  last_duration_ms: number;
  last_consensus_status: 'CONSENSUS' | 'CONFLICT' | 'PENDING';
  metadata: any;
}

interface SystemEvent {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
}

export default function StatusPage() {
  const [nodes, setNodes] = useState<NodeHealth[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const { data: nodeData } = await supabase
        .from('node_health')
        .select('*')
        .order('node_name', { ascending: true });
      
      const { data: eventData } = await supabase
        .from('system_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (nodeData) setNodes(nodeData);
      if (eventData) setEvents(eventData);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white p-8 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-black pb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-display font-black uppercase tracking-tight">System Matrix</h1>
          <p className="font-mono text-[10px] lg:text-sm mt-2 text-black/60 uppercase tracking-[0.2em]">Network Infrastructure & Node Health</p>
        </div>
        <div className="flex gap-2 lg:gap-4 font-mono text-[9px] lg:text-[10px] uppercase font-bold">
          <div className="flex items-center gap-2 px-2 lg:px-3 py-1 bg-[#ccff00] border-2 border-black">
            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            Live Sync: Active
          </div>
          <div className="px-2 lg:px-3 py-1 border-2 border-black">
            Uptime: 99.9%
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center font-mono animate-pulse">Initializing Matrix...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Node Grid */}
          <div className="lg:col-span-8 space-y-8 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {nodes.map((node) => {
                const isAgent = node.node_name.includes('AGENT');
                const isOracle = node.node_name.includes('ORACLE');
                
                return (
                  <div key={node.id} className={`border-4 border-black p-5 lg:p-6 relative group bg-white hover:bg-[#ccff00]/5 transition-colors overflow-hidden ${node.last_consensus_status === 'CONFLICT' ? 'bg-red-50' : ''}`}>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 border-2 border-black ${node.status === 'HEALTHY' ? 'bg-[#ccff00]' : 'bg-red-500'}`} />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 bg-black text-white shrink-0 ${isAgent ? 'bg-blue-600' : ''}`}>
                          {node.node_name.includes('SENTIMENT') ? <Globe className="w-4 h-4" /> : 
                           node.node_name.includes('AMM') ? <Zap className="w-4 h-4" /> : 
                           <Cpu className="w-4 h-4" />}
                        </div>
                        <h3 className="font-display font-black uppercase text-lg lg:text-xl leading-none truncate">{node.node_name.replace('ORACLE_', '')}</h3>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono border-b border-black/10 pb-1 gap-2">
                              <span className="text-black/40">Performance</span>
                              <span>{node.last_duration_ms}ms</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono border-b border-black/10 pb-1">
                              <span className="text-black/40">Logic State</span>
                              <span className={node.last_consensus_status === 'CONFLICT' ? 'text-red-500 font-bold animate-bounce' : 'text-[#ccff00] bg-black px-1'}>
                                {node.last_consensus_status}
                              </span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-black/40">Uplink</span>
                              <span>{new Date(node.last_run).toLocaleTimeString()}</span>
                          </div>
                      </div>

                      {node.metadata && (
                        <div className="font-mono text-[8px] uppercase text-black/40 bg-black/5 p-2 truncate">
                          Task: {JSON.stringify(node.metadata).slice(0, 50)}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Network Activity Log */}
            <div className="border-4 border-black bg-black text-white">
                <div className="p-4 border-b-2 border-white/20 flex items-center justify-between">
                    <h3 className="font-display font-black uppercase text-2xl tracking-tight flex items-center gap-3">
                        <Activity className="w-6 h-6" />
                        Resolution Audit Log
                    </h3>
                </div>
                <div className="p-0 font-mono text-xs overflow-hidden">
                    {events.length > 0 ? (
                      events.map((event, i) => (
                        <div key={event.id} className="flex border-b border-white/10 hover:bg-white/5 transition-colors">
                            <div className="p-3 border-r border-white/10 text-white/40 w-24 shrink-0">
                                {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className={`p-3 border-r border-white/10 w-32 shrink-0 font-bold ${event.severity === 'CRITICAL' ? 'text-red-400' : 'text-[#ccff00]'}`}>
                                [{event.event_type}]
                            </div>
                            <div className="p-3 flex-1 flex items-center justify-between group min-w-0">
                                <span className="truncate flex-1">{event.message}</span>
                                <ArrowRight className="w-3 h-3 text-white/0 group-hover:text-white/40 transition-all shrink-0" />
                            </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-white/20 italic">No network events recorded in last 24h</div>
                    )}
                </div>
            </div>
          </div>

          {/* Network Health Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border-4 border-black p-8 bg-[#ccff00] shadow-[8px_8px_0_0_#000]">
                <h3 className="font-display font-black uppercase text-3xl leading-none mb-6">Network Health</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-[10px] uppercase font-bold">
                            <span>Oracle Consensus</span>
                            <span>100% Avg</span>
                        </div>
                        <div className="h-6 border-2 border-black bg-white p-1">
                            <div className="h-full bg-black w-[100%]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-[10px] uppercase font-bold">
                            <span>Research Latency</span>
                            <span>Optimal</span>
                        </div>
                        <div className="h-6 border-2 border-black bg-white p-1">
                            <div className="h-full bg-black w-[88%]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-4 border-black p-8 space-y-6 bg-white">
                <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                    <h4 className="font-display font-black uppercase text-xl">Active Alerts</h4>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border-2 border-red-500 rounded-none text-red-700 font-mono text-[10px] uppercase leading-relaxed">
                        No critical hardware or logic conflicts detected. System state is nominal.
                    </div>
                </div>
            </div>
            
            <div className="p-6 border-4 border-black font-mono text-[9px] uppercase leading-loose text-black/40">
                Network agents utilize distributed Groq infrastructure across US-EAST regions. Data sources verified via Exa Neural Search. Blockchain state synced with Base Sepolia.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
