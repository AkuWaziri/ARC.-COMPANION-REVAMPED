import React, { useState, useEffect } from "react";
import { 
  History, Search, RefreshCw, ExternalLink, ArrowDownLeft, ArrowUpRight, 
  Settings, Filter, ArrowLeftRight, CheckCircle2, XCircle, AlertCircle, Info
} from "lucide-react";
import { Transaction } from "../types";

interface TransactionHistoryTabProps {
  address: string;
}

export default function TransactionHistoryTab({ address }: TransactionHistoryTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        // Since the latest should be on top, sort them by date descending (by timestamp / id)
        const sortedTx = [...data].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setTransactions(sortedTx);
      }
    } catch (err) {
      console.error("Failed to fetch transaction history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleClearFilters = () => {
    setFilterType("All");
    setSearchQuery("");
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === "All" || tx.type.toLowerCase() === filterType.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      tx.token.toLowerCase().includes(query) || 
      tx.txHash.toLowerCase().includes(query) ||
      tx.type.toLowerCase().includes(query) ||
      tx.amount.includes(query);
    return matchesType && matchesSearch;
  });

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getTxTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Receive": return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
      case "Buy": return "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20";
      case "Sell": return "bg-rose-500/10 text-rose-300 border border-rose-500/20";
      case "Send": return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
      case "Rebalance": return "bg-purple-500/10 text-purple-300 border border-purple-500/20";
      case "CopyTrade": return "bg-blue-500/10 text-blue-300 border border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-300 border border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "Failed":
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Top Banner Context Card */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">On-Chain Ledger Activity</h1>
            <p className="text-xs text-gray-400">Verifiable, decentralized ledger logs for {truncateAddress(address)}</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="flex items-center gap-2 self-start sm:self-auto py-2 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-150 disabled:opacity-50 select-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-purple-400" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Ledger"}
        </button>
      </div>

      {/* Main Grid: Filters & Table Card */}
      <div className="rounded-2xl bg-[#0d0d21]/40 border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
        
        {/* Filter controls bar */}
        <div className="p-4 bg-white/[0.01] border-b border-white/5 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          
          {/* Search Inputs */}
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by token, hash, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {["All", "Buy", "Sell", "Send", "Receive", "Rebalance", "CopyTrade"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-lg transition-all border font-semibold select-none cursor-pointer ${
                  filterType === type
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.1)]"
                    : "bg-white/5 text-gray-400 border-transparent hover:border-white/10 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

        </div>

        {/* List of transactions */}
        {loading && transactions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-xs text-gray-400 animate-pulse">Scanning ledger blocks for events...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-3">
              <History className="w-5 h-5 text-gray-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-300">No transactions match the criteria</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Try adjusting your filters or search terms, or complete a new transaction with our AI Agent first!
            </p>
            {(filterType !== "All" || searchQuery !== "") && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-xs font-semibold text-purple-400 hover:text-purple-300 select-none underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4">Token & Price</th>
                  <th className="py-3 px-4">On-Chain Hash</th>
                  <th className="py-3 px-4">Status & Time</th>
                  <th className="py-3 px-4 text-right">Activity Node Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredTransactions.map((tx) => {
                  const isReceive = tx.type === "Receive";
                  const isPositive = isReceive || (tx.type === "Buy" && tx.token !== "USDC");
                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-white/[0.01] transition-colors group text-xs text-gray-300"
                    >
                      {/* Name / Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isReceive ? "bg-emerald-500/10 text-emerald-400" :
                            tx.type === "Buy" ? "bg-indigo-500/10 text-indigo-400" :
                            tx.type === "Sell" ? "bg-rose-500/10 text-rose-400" :
                            "bg-amber-500/10 text-amber-400"
                          }`}>
                            {isReceive ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${getTxTypeBadgeColor(tx.type)}`}>
                              {tx.type}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-1">
                              ID: {tx.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Token & Price Info */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex flex-col">
                          <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : "-"}{tx.amount} {tx.token}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            Price: ${tx.price} USDC
                          </span>
                        </div>
                      </td>

                      {/* On-Chain Hash link */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-400 select-all hover:text-white transition-colors">
                            {truncateAddress(tx.txHash || "0x" + tx.id)}
                          </span>
                          {tx.txHash && (
                            <a
                              href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noreferrer referrer"
                              className="p-1 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Verify on Block Explorer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Status / Timestamp */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(tx.status)}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {tx.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 mt-1 font-medium">
                            {new Date(tx.date).toLocaleDateString()} &middot; {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Action/Details button */}
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`https://testnet.arcscan.app/tx/${tx.txHash || ""}`}
                          target="_blank"
                          rel="noreferrer referrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 hover:text-purple-300 select-none group-hover:translate-x-0.5 transition-transform"
                        >
                          Verify on ArcScan
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Audit disclaimer */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-purple-950/20 border border-purple-500/15 text-purple-300">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Ledger Integration:</strong> This trace is a direct mapping of block transactions signed by your connected address and recorded on the Arc Testnet. If there are pending transactions or balance updates sync latency, please use the <strong>"Refresh Ledger"</strong> trigger above to pull fresh states directly from the RPC gateway.
        </p>
      </div>

    </div>
  );
}
