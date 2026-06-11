import React, { useState, useEffect } from "react";
import { 
  Wallet, RefreshCw, Copy, ExternalLink, Plus, ClipboardCheck, 
  ArrowUpRight, ArrowDownLeft, ChevronRight, TrendingUp, Sparkles, AlertCircle 
} from "lucide-react";
import { Transaction } from "../types";

interface WalletTabProps {
  address: string;
  isDemo: boolean;
  onLogout: () => void;
}

export default function WalletTab({ address, isDemo, onLogout }: WalletTabProps) {
  const [balance, setBalance] = useState<string>("0.00");
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  // Fetch balance and transaction data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setRecentTx(data.recentTransactions || []);
      }
    } catch (err) {
      console.error("Error fetching wallet API", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [address]);

  // Copy wallet address helper
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Request faucet credits from Arc sandbox node
  const handleAddFundsSandbox = async () => {
    setFaucetLoading(true);
    try {
      const res = await fetch("/api/wallet/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, amount: 250 })
      });
      if (res.ok) {
        setFaucetSuccess(true);
        fetchData();
        setTimeout(() => setFaucetSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFaucetLoading(false);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white p-4 sm:p-6 pb-24 font-sans relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Sub-Header bar of tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">{truncateAddress(address)}</span>
                <button 
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                  title="Copy Wallet Address"
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a 
                  href={`https://testnet.arcscan.app/address/${address}`} 
                  target="_blank" 
                  rel="noreferrer referrer" 
                  className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                  title="View on Block Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                CONNECTED
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Arc Testnet
            </div>
            {isDemo && (
              <div className="py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-300">
                Sandbox Mode
              </div>
            )}
            <button 
              onClick={onLogout}
              className="py-1 px-2.5 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 transition-colors border border-rose-500/20 font-semibold"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Balance Core Metrics */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/30 to-purple-900/10 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
          {/* Accent light lines */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-[80px]"></div>

          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5cf6]">
                Portfolio Balance
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-2 flex items-baseline gap-1.5">
                <span>{balance}</span>
                <span className="text-lg font-bold text-indigo-400">USDC</span>
              </h1>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +2.48% (24H)
              </p>
            </div>

            <button 
              id="refresh-wallet-data"
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:rotate-180 duration-500 border border-white/10"
              title="Sync Ledger State"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-8 flex gap-3 relative z-10 text-xs shadow-inner">
            <a 
              href="https://faucet.circle.com/" 
              target="_blank" 
              rel="noreferrer referrer"
              className="w-full py-3 py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Testnet Funds ( Circle USDC Faucet)
            </a>
          </div>
        </div>

        {/* Feature quick links section & promotional yields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
              Arc. Account Framework
            </h3>

            {/* Assets Row */}
            <div 
              onClick={() => setShowAssetBreakdown(!showAssetBreakdown)}
              className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Native Assets</div>
                  <div className="text-[10px] text-gray-400">Total proportion distribution ledger</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showAssetBreakdown ? 'rotate-90' : ''}`} />
            </div>

            {showAssetBreakdown && (
              <div className="p-4 rounded-xl bg-[#03030d] border border-white/5 space-y-2.5 transition-all text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>USDC Stablecoin (Native)</span>
                  <span className="font-mono text-white select-all">{balance} USDC (100.0%)</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[100%] rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-gray-500 text-[10px]">
                  <span>Ethereum VM State Layer</span>
                  <span>0.00 ETH</span>
                </div>
              </div>
            )}

            {/* Earn Row */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Yield & Vaults</div>
                  <div className="text-[10px] text-gray-400">Passive network validator allocation</div>
                </div>
              </div>
              <span className="text-[10px] font-bold py-1 px-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                Earn up to 15% APR
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
              Secondary Financial Modules
            </h3>

            {/* Futures Row */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Synthetic Futures</div>
                  <div className="text-[10px] text-gray-400">Speculate on global assets on-chain</div>
                </div>
              </div>
              <span className="text-[10px] font-bold py-1 px-2 text-emerald-400/20 text-emerald-300 rounded bg-emerald-500/10">
                L2 Equities Live
              </span>
            </div>

            {/* Card Row */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Arc Debit Node Card</div>
                  <div className="text-[10px] text-gray-400">Spend crypto in direct real-world transactions</div>
                </div>
              </div>
              <span className="text-[10px] font-bold py-1 px-2 text-rose-400/20 text-rose-300 rounded bg-rose-500/10">
                6% Cashback Node
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">
              STransactions History
            </h3>
            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md font-mono">
              Limit 5
            </span>
          </div>

          <div className="space-y-2.5">
            {recentTx.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 italic">
                No local transaction events recorded on this wallet session. Keep trading to build ledger trace.
              </div>
            ) : (
              recentTx.map((tx) => (
                <div key={tx.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tx.type === "Receive" ? "bg-emerald-500/10 text-emerald-400" :
                      tx.type === "Buy" ? "bg-indigo-500/10 text-indigo-400" :
                      "bg-rose-500/10 text-rose-400"
                    }`}>
                      {tx.type === "Receive" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-200">
                        {tx.type} {tx.token}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {truncateAddress(tx.txHash)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`font-mono font-bold ${
                        tx.type === "Receive" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {tx.type === "Receive" ? "+" : "-"}{tx.amount} {tx.token}
                      </span>
                      <div className="text-[9px] text-[#f59e0b] uppercase font-bold tracking-wider mt-0.5">
                        {tx.status}
                      </div>
                    </div>

                    <a
                      href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                      title="View on Arcscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
