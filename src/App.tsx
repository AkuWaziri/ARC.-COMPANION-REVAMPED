import React, { useState, useEffect } from "react";
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter, queryClient } from "./lib/web3Config";
import { 
  Wallet, Sparkles, Compass, Users, ShieldAlert, History
} from "lucide-react";

import LandingPage from "./components/LandingPage";
import WalletTab from "./components/WalletTab";
import AIAgentTab from "./components/AIAgentTab";
import TransactionHistoryTab from "./components/TransactionHistoryTab";
import AnalyticsTab from "./components/AnalyticsTab";
import ProfilesTab from "./components/ProfilesTab";
import SecurityTab from "./components/SecurityTab";

const config = wagmiAdapter.wagmiConfig;

function AppContent() {
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [wallet, setWallet] = useState<string | null>(null);
  const [demoAddress, setDemoAddress] = useState<string | null>(() => {
    return localStorage.getItem("arc_demo_addr");
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("arc_active_tab") || "wallet";
  });

  const [email2FA, setEmail2FA] = useState<string>(() => {
    return localStorage.getItem("arc_email_2fa") || "SuleimanU45@gmail.com";
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    return localStorage.getItem("arc_2fa_enabled") === "true";
  });

  const userSignedOut = localStorage.getItem("arc_user_signed_out");

  // If manually signed out, treat as disconnected
  const isConnected = (isWagmiConnected || !!demoAddress) && userSignedOut !== "true";
  const address = isConnected ? (wagmiAddress || demoAddress) : null;
  const isDemo = !wagmiAddress && !!demoAddress;

  // Clear the signed out flag once they reconnect
  useEffect(() => {
    if ((isWagmiConnected && wagmiAddress) || demoAddress) {
      localStorage.removeItem("arc_user_signed_out");
    }
  }, [isWagmiConnected, wagmiAddress, demoAddress]);

  useEffect(() => {
    if (demoAddress) {
      localStorage.setItem("arc_demo_addr", demoAddress);
    } else {
      localStorage.removeItem("arc_demo_addr");
    }
  }, [demoAddress]);

  useEffect(() => {
    localStorage.setItem("arc_active_tab", activeTab);
  }, [activeTab]);

  const handleSuccessConnect = (connectedAddress: string, triggerDemo: boolean) => {
    localStorage.removeItem("arc_user_signed_out");
    if (triggerDemo) {
      setDemoAddress(connectedAddress);
    } else {
      setDemoAddress(null);
    }
    setActiveTab("wallet");
  };

  const handleLogOut = async () => {
    try {
      // Tell wagmi to disconnect from the provider cleanly
      await disconnect();
    } catch (e) {
      console.warn("Wagmi disconnect failed", e);
    }
    
    // Clear everything
    setWallet(null);
    localStorage.clear();
    localStorage.setItem("arc_user_signed_out", "true");
    
    // Hard redirect to connection page
    window.location.replace("/");
  };

  // Provide both casing references so child components call successfully
  const handleLogout = () => {
    handleLogOut();
  };

  const handleClearLocalData = () => {
    localStorage.clear();
    setDemoAddress(null);
    setEmail2FA("SuleimanU45@gmail.com");
    setIs2FAEnabled(false);
    disconnect();
    window.location.reload();
  };

  const handleToggle2FA = (enabled: boolean, emailAddress: string) => {
    setIs2FAEnabled(enabled);
    setEmail2FA(emailAddress);
    localStorage.setItem("arc_2fa_enabled", enabled ? "true" : "false");
    localStorage.setItem("arc_email_2fa", emailAddress);
  };

  // State refresher helper to sync between cards
  const [syncState, setSyncState] = useState(0);
  const handleSyncRefresher = () => {
    setSyncState(prev => prev + 1);
  };

  if (!isConnected || !address) {
    return <LandingPage onSuccessConnect={handleSuccessConnect} />;
  }

  // Floating nav highlights based on selected background theme spec
  const getPageBg = () => {
    switch (activeTab) {
      case "wallet": return "bg-[#0a0a1a]";
      case "ai": return "bg-[#001a1a]";
      case "history": return "bg-[#0e0d1f]";
      case "analytics": return "bg-[#0d0d2b]";
      case "profiles": return "bg-[#0a0f1a]";
      case "security": return "bg-[#1a0a0a]";
      default: return "bg-[#0a0a1a]";
    }
  };

  const tabs = [
    { id: "wallet", label: "Wallet", icon: Wallet, color: "text-indigo-400" },
    { id: "ai", label: "AI Agent", icon: Sparkles, color: "text-teal-400" },
    { id: "history", label: "Transaction History", icon: History, color: "text-purple-400" },
    { id: "analytics", label: "Analytics", icon: Compass, color: "text-indigo-400" },
    { id: "profiles", label: "Profiles", icon: Users, color: "text-blue-400" },
    { id: "security", label: "Security", icon: ShieldAlert, color: "text-rose-400" }
  ];

  return (
    <div className={`min-h-screen ${getPageBg()} transition-colors duration-500 text-white flex flex-col`}>
      {/* Dynamic Network / Logo Header Row (Desktop top bar context) */}
      <header className="px-6 py-3 border-b border-white/[0.04] backdrop-blur-md bg-black/10 sm:block hidden select-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <svg className="w-6 h-6 filter drop-shadow-[0_0_6px_rgba(56,189,248,0.3)] select-none shrink-0" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="nav-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="nav-head-gradient" x1="80" y1="35" x2="80" y2="135" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id="nav-screen-gradient" x1="80" y1="52" x2="80" y2="122" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#080710" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Antenna */}
              <rect x="77" y="24" width="6" height="15" rx="3" fill="#cbd5e1" />
              <circle cx="80" cy="18" r="9" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />

              {/* Side Ears */}
              <rect x="18" y="70" width="12" height="30" rx="6" fill="#cbd5e1" />
              <rect x="130" y="70" width="12" height="30" rx="6" fill="#cbd5e1" />

              {/* Main Outer Head Frame */}
              <rect x="26" y="38" width="108" height="92" rx="42" fill="url(#nav-head-gradient)" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Inner Faceplate Screen */}
              <rect x="36" y="48" width="88" height="72" rx="30" fill="url(#nav-screen-gradient)" stroke="#1e293b" strokeWidth="2" />
              
              {/* Inner Blue screen accent ring */}
              <rect x="38" y="50" width="84" height="68" rx="28" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.8" />

              {/* Glowing Eyes */}
              <rect x="58" y="68" width="8" height="24" rx="4" fill="#38bdf8" filter="url(#nav-neon-glow)" />
              <rect x="60" y="70" width="4" height="20" rx="2" fill="#ffffff" />

              <rect x="94" y="68" width="8" height="24" rx="4" fill="#38bdf8" filter="url(#nav-neon-glow)" />
              <rect x="96" y="70" width="4" height="20" rx="2" fill="#ffffff" />

              {/* Smiling mouth */}
              <path d="M70 98 C73 104, 87 104, 90 98" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#nav-neon-glow)" />
              <path d="M70 98 C73 104, 87 104, 90 98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            <span className="font-extrabold tracking-tight text-sm">Arc. Companion</span>
            <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded bg-white/5 font-mono">1.0.0-Beta</span>
          </div>

          {/* Integrated Desktop Tab Menu */}
          <nav className="p-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-0.5 shadow-lg max-w-xl mx-auto">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  id={`nav-desktop-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-3.5 rounded-full flex items-center gap-1 transition-all outline-none focus:outline-none focus:ring-0 shrink-0 whitespace-nowrap ${
                    isActive 
                      ? "bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.06)]" 
                      : "text-gray-400 hover:text-gray-100"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? tab.color : "text-gray-400"}`} />
                  <span className="text-[11px] font-bold leading-none whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Secured Node Sync
            </span>
          </div>
        </div>
      </header>

      {/* Main viewport segment */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-24 sm:pb-6">
          {activeTab === "wallet" && (
            <div key={`wallet-${syncState}`}>
              <WalletTab 
                address={address} 
                isDemo={isDemo} 
                onLogout={handleLogout} 
              />
            </div>
          )}
          {activeTab === "ai" && (
            <div key="ai-main-tab">
              <AIAgentTab 
                address={address} 
                isDemo={isDemo} 
                email2FA={email2FA} 
                is2FAEnabled={is2FAEnabled}
                onTransactionLogged={handleSyncRefresher}
              />
            </div>
          )}
          {activeTab === "history" && (
            <div key={`history-${syncState}`}>
              <TransactionHistoryTab address={address} />
            </div>
          )}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "profiles" && <ProfilesTab address={address} />}
          {activeTab === "security" && (
            <SecurityTab 
              address={address} 
              isDemo={isDemo} 
              email2FA={email2FA} 
              is2FAEnabled={is2FAEnabled} 
              onToggle2FA={handleToggle2FA} 
              onLogout={handleLogout} 
              onClearLocalData={handleClearLocalData} 
            />
          )}
        </div>
      </main>

      {/* Floating Pill Nav Bar Container (Mobile Only) */}
      <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40 flex justify-center font-sans select-none">
        <nav className="p-1 bg-black/85 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-0.5 shadow-2xl shadow-black/55 overflow-x-auto scrollbar-none max-w-full">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`nav-mobile-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 rounded-full flex items-center gap-1.5 transition-all outline-none focus:outline-none focus:ring-0 shrink-0 whitespace-nowrap ${
                  isActive 
                    ? "bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.06)]" 
                    : "text-gray-400 hover:text-gray-100"
                }`}
              >
                <IconComp className={`w-4 h-4 ${isActive ? tab.color : "text-gray-400"}`} />
                <span className="text-xs font-bold leading-none whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <footer className="w-full border-t border-white/[0.04] py-6 px-6 mt-auto bg-black/15 z-10 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">© Arc. Companion. 2026 By WAZIRI.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="https://x.com/arccompanion" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors" title="Twitter">
              <svg className="w-4.5 h-4.5 text-gray-400 hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors" title="Telegram">
              <svg className="w-4.5 h-4.5 text-gray-400 hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.3 1.14-3.66 2.74-.35.24-.66.35-.94.35-.3 0-.89-.16-1.32-.3-.53-.18-.95-.28-.92-.59.02-.16.24-.33.67-.5 2.62-1.14 4.37-1.89 5.25-2.25 2.5-.1 3.01.07 2.89.9z"></path>
              </svg>
            </a>
            <span className="flex items-center gap-1.5 text-[11px] bg-purple-950/20 border border-purple-500/15 text-purple-300 px-2.5 py-1 rounded-full font-medium ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live on Arc. Testnet
            </span>
          </div>

          <div className="hidden sm:block w-36 text-right text-[10px] text-gray-600 font-mono">
            SECURE PORT
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
