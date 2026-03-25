'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, UserPlus, Clock } from 'lucide-react';

interface Invite {
  id: string;
  code: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvites(data || []);
    } catch (err) {
      console.error('Error fetching invites:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateInvite() {
    setIsGenerating(true);
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from('invites')
        .insert([{
          code,
          max_uses: 1,
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setInvites([data, ...invites]);
    } catch (err) {
      alert('Failed to generate invite');
    } finally {
      setIsGenerating(false);
    }
  }

  async function deleteInvite(id: string) {
    if (!confirm('Permanent revocation? This code will no longer function.')) return;
    
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .match({ id });
      
      if (error) throw error;
      setInvites(invites.filter(i => i.id !== id));
    } catch (err) {
      alert('Deletion failed');
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white p-8 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-black pb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-display font-black uppercase tracking-tighter">Access Keys</h1>
          <p className="font-mono text-[10px] lg:text-sm mt-2 text-black/60 uppercase tracking-[0.3em]">Invite-Only Gatekeeper Protocol</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateInvite}
          disabled={isGenerating}
          className="px-6 py-3 bg-black text-white font-display font-bold uppercase text-sm flex items-center gap-2 hover:bg-[#ccff00] hover:text-black transition-all"
        >
          <Plus className="w-4 h-4" />
          {isGenerating ? 'GEN_KEY...' : 'Issue New Key'}
        </motion.button>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center font-mono">Loading Keys...</div>
      ) : (
        <div className="border border-black/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black font-mono text-[10px] uppercase tracking-widest text-black/40">
                <th className="px-6 py-4 font-bold">Key Identifier</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Capacity</th>
                <th className="px-6 py-4 font-bold">Expiration</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const isExpired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
                const isDepleted = invite.uses >= invite.max_uses;
                const isActive = !isExpired && !isDepleted;

                return (
                  <tr key={invite.id} className="border-b border-black/5 hover:bg-[#ccff00]/5 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 border border-black/10 ${isActive ? 'bg-[#ccff00]' : 'bg-black text-white'}`}>
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-black text-xl tracking-tight uppercase">{invite.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`font-mono text-[10px] uppercase font-bold px-2 py-1 border ${
                        isActive ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'
                      }`}>
                        {isExpired ? 'Expired' : isDepleted ? 'Depleted' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="font-mono text-xs">
                        <span className="font-bold">{invite.uses}</span>
                        <span className="text-black/20"> / </span>
                        <span className="text-black/40">{invite.max_uses}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-xs text-black/60">
                      {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'NO_EXPIRY'}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => copyToClipboard(invite.code, invite.id)}
                          className="p-2 border border-black/10 hover:bg-black hover:text-white transition-all"
                          title="Copy Key"
                        >
                          {copiedId === invite.id ? <Check className="w-4 h-4 text-[#ccff00]" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => deleteInvite(invite.id)}
                          className="p-2 border border-black/10 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {invites.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <ShieldAlert className="w-12 h-12 text-black/10" />
              <p className="font-display font-black uppercase text-2xl text-black/20">Gatekeeper Protocol Offline</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
