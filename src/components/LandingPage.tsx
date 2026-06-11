import React, { useState, useEffect } from "react";
import { useConnect, useAccount, useSwitchChain } from "wagmi";
import { Wallet, Shield, Layers } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onSuccessConnect: (address: string, isDemo: boolean) => void;
}

export default function LandingPage({ onSuccessConnect }: LandingPageProps) {
  const { connect, connectors, error: connectError } = useConnect();
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, error: switchError } = useSwitchChain();
  const [localError, setLocalError] = useState<string | null>(null);

  // Suggested wallets as requested by spec
  const wallets = [
    { id: "metamask", name: "MetaMask", badge: "EIP-6963", iconColor: "text-amber-500" },
    { id: "rabby", name: "Rabby Wallet", badge: "ONE-CLICK", iconColor: "text-blue-400" },
    { id: "trust", name: "Trust Wallet", badge: "DEEP LINK", iconColor: "text-indigo-400" },
    { id: "coinbase", name: "Coinbase Wallet", badge: "ONE-CLICK", iconColor: "text-blue-600" },
    { id: "rainbow", name: "Rainbow", badge: "MOBILE CONNECT", iconColor: "text-pink-400" },
  ];

  const switchToArcTestnet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x4cef52" }]
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x4cef52",
            chainName: "Arc Testnet",
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
            rpcUrls: ["https://rpc.testnet.arc.network"],
            blockExplorerUrls: ["https://testnet.arcscan.app"]
          }]
        });
      }
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      localStorage.removeItem("arc_user_signed_out");
      switchToArcTestnet().finally(() => {
        onSuccessConnect(address, false);
      });
    }
  }, [isConnected, address]);

  const handleWalletConnect = (walletId: string) => {
    setLocalError(null);
    const injectedConnector = connectors.find(c => c.id === "injected" || c.name.toLowerCase().includes("injected"));
    
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] });
    } else {
      setLocalError("No injected Web3 provider detected in your browser. Please install MetaMask and try opening this page in a new window or tab.");
    }
  };

  const handleSwitchChain = async () => {
    try {
      await switchToArcTestnet();
    } catch (err) {
      setLocalError("Failed to switch network. Please add Arc Testnet manually in MetaMask.");
    }
  };

  const rawError = localError || connectError?.message || switchError?.message;
  const displayError = rawError && (
    rawError.toLowerCase().includes("unauthorized") || 
    rawError.toLowerCase().includes("authorized") || 
    rawError.toLowerCase().includes("connection") || 
    rawError.toLowerCase().includes("receiving end")
  ) ? "Your browser wallet extension has blocked connections inside this iframe. Please open the app in a new tab/window using the external link icon or install MetaMask." : rawError;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-x-hidden font-sans bg-gradient-to-b from-[#1a0533] to-[#000000] text-white max-[379px]:p-3">
      {/* Dynamic Grid Background Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Decorative Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-900/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-fuchsia-900/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      <motion.div 
        id="landing-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto z-10 px-4 py-6 sm:p-8 md:p-10 max-[379px]:px-3 max-[379px]:py-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative"
      >
        {/* Glow Line Top */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
          {/* Logo and Branding header (Left on desktop, centered on mobile) */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-4 select-none shrink-0">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-[0_0_12px_rgba(56,189,248,0.3)]" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="head-gradient" x1="80" y1="35" x2="80" y2="135" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>
                  <linearGradient id="screen-gradient" x1="80" y1="52" x2="80" y2="122" gradientUnits="userSpaceOnUse">
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
                <rect x="26" y="38" width="108" height="92" rx="42" fill="url(#head-gradient)" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Inner Faceplate Screen */}
                <rect x="36" y="48" width="88" height="72" rx="30" fill="url(#screen-gradient)" stroke="#1e293b" strokeWidth="2" />
                
                {/* Inner Blue screen accent ring */}
                <rect x="38" y="50" width="84" height="68" rx="28" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.8" />

                {/* Glowing Eyes */}
                <rect x="58" y="68" width="8" height="24" rx="4" fill="#38bdf8" filter="url(#neon-glow)" />
                <rect x="60" y="70" width="4" height="20" rx="2" fill="#ffffff" />

                <rect x="94" y="68" width="8" height="24" rx="4" fill="#38bdf8" filter="url(#neon-glow)" />
                <rect x="96" y="70" width="4" height="20" rx="2" fill="#ffffff" />

                {/* Smiling mouth */}
                <path d="M70 98 C73 104, 87 104, 90 98" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#neon-glow)" />
                <path d="M70 98 C73 104, 87 104, 90 98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <h1 id="app-title" className="text-2xl sm:text-3xl md:text-4xl max-[379px]:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400">
              Arc. Companion
            </h1>
            
            <div className="mt-4 text-center md:text-left text-xs max-[379px]:text-[11px] leading-loose text-purple-300 px-1 select-text md:max-w-sm">
              Secure AI Assistance. Chat Automation. Investment. Analytics. Wallet. Trade & More. Powered by Arc. Network.
            </div>
          </div>

          {/* Connection, Configuration Prompt & Wallets (Right on desktop, below on mobile) */}
          <div className="md:col-span-7 flex flex-col justify-center w-full">
            {/* Chain Configuration Prompt Status */}
            {isConnected && chainId !== 5042002 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex flex-col items-center text-center gap-2 max-[379px]:p-2">
                <p className="text-xs sm:text-sm font-medium">Please switch your network to enjoy Arc Testnet services.</p>
                <button
                  id="switch-network-btn"
                  onClick={handleSwitchChain}
                  className="py-1.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-transform text-black text-xs max-[379px]:text-[11px] font-bold rounded-lg shadow-lg flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Switch to Arc Testnet
                </button>
              </div>
            )}

            {/* Error Messages Inline */}
            {displayError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs max-[379px]:text-[11px] leading-relaxed text-center">
                {displayError}
              </div>
            )}

            {/* Wallet connection grid */}
            <div className="space-y-3">
              <h2 className="text-xs max-[379px]:text-[11px] font-semibold text-gray-400 uppercase tracking-widest pl-1">
                Secure Wallets Connetion
              </h2>

              <div className="w-full flex flex-col gap-2.5">
                {wallets.map((w) => (
                  <button
                    id={`wallet-btn-${w.id}`}
                    key={w.id}
                    onClick={() => handleWalletConnect(w.id)}
                    className="w-full flex items-center justify-between px-4 py-3 max-[379px]:px-3 max-[379px]:py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.99] transition-all text-left group gap-3 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Wallet className={`w-6 h-6 shrink-0 ${w.iconColor}`} />
                      <span className="text-sm max-[379px]:text-xs font-semibold text-gray-100 group-hover:text-purple-300 transition-colors truncate">
                        {w.name}
                      </span>
                    </div>
                    <span className="text-[9px] max-[379px]:text-[8px] font-bold px-2.5 py-1 rounded bg-white/10 text-gray-300 shrink-0">
                      {w.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="mt-8 text-[11px] max-[379px]:text-[10px] text-gray-500 z-10 flex items-center gap-2 shrink-0">
        <Shield className="w-3.5 h-3.5 text-purple-400" />
        <span>Arc Testnet Chain ID: 5042002 (USDC Native)</span>
      </div>
    </div>
  );
}
