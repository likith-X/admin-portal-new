"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Globe, TrendingUp } from "lucide-react";

export default function LuxuryDashboard() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-24 pb-20"
    >
      <motion.div variants={itemVars} className="space-y-6 max-w-3xl">
        <h2 className="font-display font-bold text-6xl md:text-7xl leading-[1.05] tracking-tight">
          Network State <br/> & Intelligence.
        </h2>
        <p className="font-mono text-sm leading-relaxed text-black/60 max-w-xl">
          Real-time performance metrics across all decentralized agents and active prediction markets. System is running at optimal synchronization.
        </p>
      </motion.div>

      <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <DataStat title="Total Value Locked" value="$8,495,200" trend="+14.5%" isPositive={true} />
        <DataStat title="Active Node Agents" value="1,248" trend="+5.2%" isPositive={true} />
        <DataStat title="Consensus Accuracy" value="99.98%" trend="+0.01%" isPositive={true} />
        <DataStat title="Orphaned Markets" value="03" trend="-2" isPositive={false} />
      </motion.div>

      {/* Market Trends Section */}
      <motion.div variants={itemVars} className="pt-8">
        <div className="flex items-end justify-between border-b-[2px] border-black pb-4 mb-8">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-2xl tracking-tight">Market Trends</h3>
            <span className="font-mono text-[9px] uppercase tracking-widest bg-[#ccff00] text-black px-2 py-0.5">Live</span>
          </div>
          <button className="font-mono text-[10px] uppercase tracking-widest text-[#111111] hover:text-black/50 transition-colors flex items-center gap-2">
            Volume Config <TrendingUp className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MarketTrend 
            asset="ETH / USD" 
            category="Crypto Core" 
            currentPrice="$3,450.21" 
            change="+4.2%" 
            data={[20, 25, 23, 28, 35, 42, 38, 45, 50]} 
          />
          <MarketTrend 
            asset="US Treasury 10Y" 
            category="Macro Rates" 
            currentPrice="4.25%" 
            change="-0.1%" 
            data={[50, 48, 49, 45, 42, 40, 44, 40, 38]} 
          />
          <MarketTrend 
            asset="AI Compute Index" 
            category="Network Hash" 
            currentPrice="1,842.50" 
            change="+12.4%" 
            data={[10, 15, 25, 30, 45, 55, 60, 80, 95]} 
          />
        </div>
      </motion.div>

      {/* Protocol Ledger Section */}
      <motion.div variants={itemVars} className="pt-8">
        <div className="flex items-end justify-between border-b-[2px] border-black pb-4 mb-4">
          <h3 className="font-display font-bold text-2xl tracking-tight">Protocol Ledger</h3>
          <button className="font-mono text-[10px] uppercase tracking-widest text-[#111111] hover:text-black/50 transition-colors">
            View Full History →
          </button>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-12 gap-4 py-3 font-mono text-[10px] uppercase tracking-widest text-black/40">
            <div className="col-span-5 md:col-span-4">Event Identity</div>
            <div className="hidden md:block md:col-span-3">Entity Node</div>
            <div className="col-span-3 md:col-span-2 text-right">Volume</div>
            <div className="col-span-4 md:col-span-3 text-right">Resolution</div>
          </div>

          <motion.div variants={containerVars} initial="hidden" animate="show">
            <DataRow id="EV-8924" title="Federal Rates Unchanged" agent="OracleNode-X9" amount="$145,000" status="Resolved" />
            <DataRow id="EV-8923" title="New Market Deployed" agent="Manager-Beta" amount="—" status="Processing" />
            <DataRow id="EV-8922" title="Dispute Escalation: M-9" agent="Arbiter-01" amount="$28,500" status="Suspended" />
            <DataRow id="EV-8921" title="ETH Target Acquired" agent="OracleNode-X7" amount="$890,000" status="Resolved" />
            <DataRow id="EV-8920" title="API Sync Disruption" agent="Scraper-Alpha" amount="—" status="Error" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MarketTrend({ asset, category, currentPrice, change, data }: any) {
  const isPositive = change.startsWith("+");
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  const points = data.map((d: number, i: number) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="flex flex-col border border-black/10 p-6 hover:border-black transition-all group cursor-pointer bg-white"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1">{category}</div>
          <div className="font-display font-bold text-xl group-hover:underline underline-offset-4">{asset}</div>
        </div>
        <div className={`font-mono text-[10px] px-2 py-1 uppercase tracking-widest ${isPositive ? "bg-[#ccff00] text-black" : "bg-black text-white"}`}>
          {change}
        </div>
      </div>
      
      <div className="mt-auto flex items-end justify-between">
        <div className="font-mono text-2xl tracking-tighter">{currentPrice}</div>
        <div className="w-20">
          <svg viewBox={`0 -5 ${width} ${height + 10}`} className="w-full h-8 overflow-visible">
            <polyline
              fill="none"
              stroke={isPositive ? "black" : "rgba(0,0,0,0.3)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}

function DataStat({ title, value, trend, isPositive }: any) {
  return (
    <div className="flex flex-col border-l border-black/10 pl-6 py-2 transition-all hover:border-black duration-500">
      <div className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-3">{title}</div>
      <div className="font-mono text-3xl tracking-tighter text-[#111111] mb-2">{value}</div>
      <div className={`flex items-center gap-1.5 font-mono text-[11px] ${
        isPositive ? "text-black" : "text-black/50"
      }`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {trend}
      </div>
    </div>
  );
}

function DataRow({ id, title, agent, amount, status }: any) {
  const getStatusStyle = (s: string) => {
    switch(s) {
      case 'Resolved': return "bg-[#ccff00] text-black border-transparent";
      case 'Processing': return "bg-black text-white border-transparent";
      case 'Suspended': return "bg-white text-black border-black border";
      default: return "bg-[#f0f0f0] text-black/40";
    }
  };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
      }}
      whileHover={{ scale: 1.005, backgroundColor: "#fafafa" }}
      className="grid grid-cols-12 gap-4 py-5 border-b border-black/5 items-center transition-colors cursor-pointer group"
    >
      <div className="col-span-5 md:col-span-4 pl-2">
        <div className="font-display font-semibold text-sm group-hover:underline underline-offset-4">{title}</div>
        <div className="font-mono text-[10px] text-black/40 mt-1">{id}</div>
      </div>
      <div className="hidden md:flex md:col-span-3 items-center gap-2">
        <Globe className="w-3 h-3 text-black/30" />
        <span className="font-mono text-xs text-black/70">{agent}</span>
      </div>
      <div className="col-span-3 md:col-span-2 text-right font-mono text-xs font-semibold">
        {amount}
      </div>
      <div className="col-span-4 md:col-span-3 flex justify-end">
        <span className={`px-3 py-1 text-[9px] font-mono uppercase tracking-widest ${getStatusStyle(status)}`}>
          {status}
        </span>
      </div>
    </motion.div>
  );
}
