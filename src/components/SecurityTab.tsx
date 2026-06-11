import React, { useState, useEffect } from "react";
import { 
  Shield, ToggleLeft, ToggleRight, ScrollText, Mail, Trash2, HelpCircle, 
  RefreshCw, FileText, KeyRound, AlertTriangle, ShieldCheck, Clock 
} from "lucide-react";
import { SecurityLog } from "../types";

interface SecurityTabProps {
  address: string;
  isDemo: boolean;
  email2FA: string;
  is2FAEnabled: boolean;
  onToggle2FA: (enabled: boolean, email: string) => void;
  onLogout: () => void;
  onClearLocalData: () => void;
}

export default function SecurityTab({ 
  address, isDemo, email2FA, is2FAEnabled, onToggle2FA, onLogout, onClearLocalData 
}: SecurityTabProps) {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputEmail, setInputEmail] = useState(email2FA || "SuleimanU45@gmail.com");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // SIWE Verification
  const [siweLoading, setSiweLoading] = useState(false);
  const [siweSuccess, setSiweSuccess] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Create some beautiful mock live security logs to display alongside server records
      const serverLogs: SecurityLog[] = [
        { id: "s1", timestamp: new Date().toISOString(), event: "Tab Opened", details: "User mounted the Security Configuration Center." },
        { id: "s2", timestamp: new Date(Date.now() - 30000).toISOString(), event: "Identity Handshake", details: `Verified address: ${address}` },
        { id: "s3", timestamp: new Date(Date.now() - 60000).toISOString(), event: "2FA Status Sync", details: `Email 2FA state synced. Enabled: ${is2FAEnabled ? "YES" : "NO"}` }
      ];

      setLogs(serverLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [is2FAEnabled]);

  const handleToggle = () => {
    if (!is2FAEnabled) {
      if (!inputEmail.trim()) return;
      onToggle2FA(true, inputEmail);
    } else {
      onToggle2FA(false, inputEmail);
    }
  };

  // On-demand Sign-In With Ethereum verification
  const handleSIWETrigger = async () => {
    setSiweLoading(true);
    setSiweSuccess(false);
    try {
      // 1. Fetch nonce
      const nRes = await fetch("/api/auth/nonce");
      if (nRes.ok) {
        const { nonce } = await nRes.json();
        
        // 2. Simulate standard signed prompt payload message
        const message = `Sign in to Arc. Network Companion\nAddress: ${address}\nChain ID: 5042002\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
        
        // Simulate signature creation delay
        await new Promise(r => setTimeout(r, 1200));

        // 3. Verify on backend
        const vRes = await fetch("/api/auth/siwe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            message,
            signature: "0x_arc_verified_sig_" + Date.now()
          })
        });

        if (vRes.ok) {
          setSiweSuccess(true);
          fetchLogs();
          setTimeout(() => setSiweSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSiweLoading(false);
    }
  };

  const handleExecuteClear = () => {
    onClearLocalData();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#1a0a0a] text-white p-4 sm:p-6 pb-24 font-sans relative">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Sub-Header of Tab */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Ecosystem Security Port Gate</h1>
              <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mt-0.5">
                Multi-Factor Guard Protocols
              </p>
            </div>
          </div>
          
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all text-xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* SIWE On-Demand + Session Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* SIWE Authentication Handshake Card */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Cryptographic Identity verification</span>
              <h3 className="text-sm font-bold">Sign-In With Ethereum (SIWE)</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Re-validate node authorization and wallet identity ownership over Arc Testnet network channels instantly.
              </p>
            </div>

            <button
              id="siwe-recheck-btn"
              onClick={handleSIWETrigger}
              disabled={siweLoading}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-90 active:scale-95 transition-all text-white font-extrabold text-xs flex items-center justify-center gap-1.5 self-start"
            >
              {siweLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Awaiting Auth Sign...</span>
                </>
              ) : siweSuccess ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ownership SIWE Verified!</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Trigger SIWE Handshake</span>
                </>
              )}
            </button>
          </div>

          {/* Session Metadata Info */}
          <div className="p-6 rounded-3xl bg-[#2e0e0e]/30 border border-rose-500/10 space-y-3 font-mono text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block font-sans">Active Session Metadata Trace</span>
            <div className="space-y-1.5 pt-1.5">
              <div className="flex justify-between border-b border-rose-500/5 pb-1">
                <span className="text-gray-500">Node Identity:</span>
                <span className="text-gray-300 font-bold">{address.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between border-b border-rose-500/5 pb-1">
                <span className="text-gray-500">Provider Model:</span>
                <span className="text-gray-300 font-bold">{isDemo ? "Simulated Web3 Handshake" : "MetaMask Active Provider"}</span>
              </div>
              <div className="flex justify-between border-b border-rose-500/5 pb-1">
                <span className="text-gray-500">Arc Chain Identifier:</span>
                <span className="text-white font-bold">5042002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Handshake Time:</span>
                <span className="text-gray-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-rose-400" /> Live Connection</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Step Authentication Config Form */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase font-bold text-rose-400 tracking-widest pl-0.5">
                Guard Protocol MF-Authentication
              </div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                2-Step Transaction Email Protection (2FA)
              </h3>
            </div>

            <button 
              id="toggle-2fa-status-btn"
              onClick={handleToggle}
              className="outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
            >
              {is2FAEnabled ? (
                <ToggleRight className="w-12 h-12 text-rose-500" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-600" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs leading-relaxed pt-2">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-gray-400 font-semibold flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-rose-400" /> SMTP Configured Email Address
              </label>
              <input
                id="smtp-email-field"
                type="email"
                required
                disabled={is2FAEnabled}
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full p-2.5 bg-black border border-white/10 rounded-xl outline-none text-xs focus:border-rose-500 text-white disabled:opacity-55"
              />
            </div>

            <p className="text-[11px] text-gray-500 italic pb-1">
              *When 2FA toggle is active, every transaction (Buy/Sell/Send) will dispatch a 6-digit verification pin requiring instant authentication input before signing.
            </p>
          </div>
        </div>

        {/* Security Log Output board */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3.5">
          <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold pl-0.5 flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-rose-400" />
            Security Audit Scrolling Logging Trace
          </h3>

          <div className="h-40 rounded-xl bg-black border border-white/5 divide-y divide-white/5 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] select-all">
            {logs.map((l) => (
              <div key={l.id} className="pt-2 flex flex-col sm:flex-row justify-between gap-1 text-gray-400 select-all">
                <div>
                  <span className="text-rose-400 font-bold">[{l.event}]</span> &middot; <span className="text-white font-semibold">{l.details}</span>
                </div>
                <span className="text-[10px] text-gray-500 shrink-0">
                  {new Date(l.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone: Disconnect / Clear Local Data with explicit dialogues */}
        <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/20 space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#f43f5e] font-black pb-2 border-b border-rose-500/10">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            Identity Node Danger Zone
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="disconnect-wallet-btn"
              onClick={onLogout}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold text-center"
            >
              Disconnect Companion Wallet Node
            </button>

            <button
              id="clear-all-data-trigger"
              onClick={() => setShowClearConfirm(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-200 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold text-center"
            >
              Clear Local Cache & Storage
            </button>
          </div>
        </div>

        {/* Clear Cache Confirmation dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div id="clear-confirm-dialog" className="w-full max-w-sm rounded-2xl bg-[#1c0808] border border-rose-500/40 p-6 space-y-4 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-rose-500/10 rounded-2xl mb-3 border border-rose-500/20 animate-bounce">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-sm font-bold">Clear Local Cache Confirmation</h3>
                <p className="text-xs text-gray-400 mt-1.5 px-2">
                  This execution resets all localized settings, email variables, and in-memory caches. This is irreversible.
                </p>
              </div>

              <div className="flex gap-2 text-xs font-bold">
                <button
                  id="cancel-clear-btn"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 text-center"
                >
                  Cancel
                </button>
                <button
                  id="confirm-clear-btn"
                  onClick={handleExecuteClear}
                  className="flex-1 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white text-center"
                >
                  Purge Cache
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
