import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, AlertTriangle, CheckCircle, ArrowUpRight, Copy, ShieldCheck, 
  ExternalLink, MessageSquare, History, PieChart, Coins
} from "lucide-react";
import { useSendTransaction, useAccount, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { ChatMessage } from "../types";

interface AIAgentTabProps {
  address: string;
  isDemo: boolean;
  email2FA: string;
  is2FAEnabled: boolean;
  onTransactionLogged: () => void;
}

export default function AIAgentTab({ address, isDemo, email2FA, is2FAEnabled, onTransactionLogged }: AIAgentTabProps) {
  const { isConnected: isWagmiConnected, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const APP_VERSION = "v1.0.1";
    const savedVersion = localStorage.getItem("arc_chat_version");
    if (savedVersion !== APP_VERSION) {
      localStorage.setItem("arc_chat_version", APP_VERSION);
      localStorage.removeItem("arc_chat_messages");
      return [
        {
          id: "msg_init",
          sender: "agent",
          text: "Welcome to your Arc AI companion node. I can monitor market sentiment, portfolio metrics, Whales index, and execute test transactions. Give me a command (e.g., 'Send 10 USDC to Musa' or 'What is my portfolio worth?')",
          timestamp: new Date().toISOString()
        }
      ];
    }

    const saved = localStorage.getItem("arc_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved chat messages", e);
      }
    }
    return [
      {
        id: "msg_init",
        sender: "agent",
        text: "Welcome to your Arc AI companion node. I can monitor market sentiment, portfolio metrics, Whales index, and execute test transactions. Give me a command (e.g., 'Send 10 USDC to Musa' or 'What is my portfolio worth?')",
        timestamp: new Date().toISOString()
      }
    ];
  });

  // Save conversation messages to localStorage whenever modified
  useEffect(() => {
    if (messages && messages.length > 0) {
      localStorage.setItem("arc_chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleNewChat = () => {
    const initialMsg: ChatMessage = {
      id: "msg_init_" + Date.now(),
      sender: "agent",
      text: "Welcome to your Arc AI companion node. I can monitor market sentiment, portfolio metrics, Whales index, and execute test transactions. Give me a command (e.g., 'Send 10 USDC to Musa' or 'What is my portfolio worth?')",
      timestamp: new Date().toISOString()
    };
    setMessages([initialMsg]);
    localStorage.setItem("arc_chat_messages", JSON.stringify([initialMsg]));
  };
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("AI Agent analyzing intent...");
  const pendingQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // OTP Verification overlay inside chat
  const [otpmode, setOtpMode] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSentCode, setOtpSentCode] = useState(""); // Dev fallback aid
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingTxToConfirm, setPendingTxToConfirm] = useState<any>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Wallet signature and on-chain loading states
  const [signingMessageId, setSigningMessageId] = useState<string | null>(null);
  const [signingError, setSigningError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // Suggestion chips as specified in tech specs
  const suggestChips = [
    "Send 10 USDC to Musa",
    "Buy 50 USDC worth of ETH",
    "Rebalance portfolio 60% USDC 40% ETH",
    "Analyze my spending",
    "What is my portfolio worth?",
    "Show me my transaction history"
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message to chat state
    const userMsgId = "msg_user_" + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setUserInput("");

    // Push prompt to the ref queue
    pendingQueueRef.current.push(textToSend);

    // Process the queue
    processQueue();
  };

  const processQueue = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);

    while (pendingQueueRef.current.length > 0) {
      const currentText = pendingQueueRef.current[0];
      setLoadingText("AI Agent analyzing intent...");

      const maxRetries = 3;
      let success = false;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          if (attempt > 0) {
            setLoadingText(`Processing your request, please wait (retrying ${attempt}/${maxRetries})...`);
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            setLoadingText("Processing your request, please wait...");
          }

          const res = await fetch("/api/parse-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: currentText, address }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();

            // Formulate agent message state
            const agentMsgId = "msg_agent_" + Date.now();
            const newAgentMsg: ChatMessage = {
              id: agentMsgId,
              sender: "agent",
              text: data.answer || "I parsed that request but couldn't generate a specific response.",
              timestamp: new Date().toISOString()
            };

            // If the intent parsed requires user action (confirm trade or transfer)
            if (["transfer", "trade", "rebalance", "copy_trade"].includes(data.type)) {
              newAgentMsg.pendingTx = {
                type: data.type as any,
                recipient: data.recipient,
                amount: data.amount,
                token: data.token,
                memo: data.memo,
                estimatedGas: data.estimatedGas || "0.005 USDC",
                targetAllocation: data.targetAllocation,
                traderAddress: data.traderAddress
              };
            }

            setMessages(prev => [...prev, newAgentMsg]);
            success = true;
            break; // Break the automatic retry loop on success
          } else {
            throw new Error(`Server returned status ${res.status}`);
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error(`Attempt ${attempt} failed:`, err);

          if (attempt === maxRetries) {
            const isTimeout = err.name === "AbortError";
            const errorText = isTimeout
              ? "My communications link with the core AI timed out. Please check your network and try again."
              : "My communications link with the core AI is currently overloaded. Please try again in brief moments.";

            setMessages(prev => [...prev, {
              id: "msg_err_" + Date.now(),
              sender: "agent",
              text: errorText,
              timestamp: new Date().toISOString(),
              retryPrompt: currentText
            }]);
          }
        }
      }

      // Remove the processed item from the queue
      pendingQueueRef.current.shift();
    }

    isProcessingRef.current = false;
    setLoading(false);
  };

  // Handle click of suggetion chips
  const handleChipClick = (chip: string) => {
    handleSendMessage(chip);
  };

  // Triggers visual wallet sign confirmation
  const handleInitiateConfirmAndSign = (pendingTx: any, messageId: string) => {
    setPendingTxToConfirm(pendingTx);
    setActiveMessageId(messageId);

    // If 2FA enabled, triggers OTP security gate
    if (is2FAEnabled && email2FA) {
      trigger2FAOTP();
    } else {
      executeSigning(pendingTx, messageId);
    }
  };

  const trigger2FAOTP = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email2FA })
      });
      if (res.ok) {
        const rdata = await res.json();
        setOtpSentCode(rdata.otp || ""); // Save for helper preview tip
        setOtpMode(true);
      } else {
        setOtpError("Failed to issue 2-Step OTP email challenge.");
      }
    } catch (err) {
      setOtpError("Network error issuing OTP challenge.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email2FA, otp: otpValue })
      });
      if (res.ok) {
        setOtpMode(false);
        setOtpValue("");
        // Execute the signing securely!
        if (pendingTxToConfirm && activeMessageId) {
          executeSigning(pendingTxToConfirm, activeMessageId);
        }
      } else {
        const edat = await res.json();
        setOtpError(edat.error || "OTP code verification rejected.");
      }
    } catch (err) {
      setOtpError("Error verifying OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const executeSigning = async (tx: any, mId: string) => {
    console.log("executeSigning called.", tx, "msgId:", mId);
    if (!isWagmiConnected) {
      console.warn("Wallet is not connected.");
      setSigningError("No MetaMask on-chain wallet connector is active. Please connect your Web3 wallet at the top of the app.");
      return;
    }

    setSigningMessageId(mId);
    setSigningError(null);
    setLoading(true);

    try {
      // Switch to Arc Testnet (chain ID 5042002) if on other network
      if (chainId !== 5042002) {
        console.log("Switching network chain to Arc Testnet (5042002)...");
        try {
          await switchChainAsync({ chainId: 5042002 });
        } catch (switchErr: any) {
          console.error("Chain switch request declined or failed:", switchErr);
          setSigningError("Network Switch Required: Please approve the Arc Testnet RPC switch in MetaMask.");
          setLoading(false);
          setSigningMessageId(null);
          return;
        }
      }

      let hash = "";
      try {
        const sendVal = tx.amount && !isNaN(parseFloat(tx.amount)) && parseFloat(tx.amount) > 0 ? parseFloat(tx.amount).toString() : "0.0001";
        console.log(`Sending tx via wallet... Target recipient:${tx.recipient || address}, Value Eth:${sendVal}`);
        const txResult = await sendTransactionAsync({
          to: (tx.recipient || address) as `0x${string}`,
          value: parseEther(sendVal)
        });
        hash = txResult;
        console.log("On-chain wallet approval receipt hash:", hash);
      } catch (walletErr: any) {
        console.warn("Browser MetaMask signing rejected or failed:", walletErr);
        const errStr = walletErr?.message || String(walletErr);
        if (errStr.toLowerCase().includes("rejected") || errStr.toLowerCase().includes("user denied")) {
          setSigningError("Signature Request Denied: You declined the confirmation inside MetaMask.");
        } else {
          setSigningError(`Wallet Confirmation Error: ${errStr.slice(0, 100)}`);
        }
        setLoading(false);
        setSigningMessageId(null);
        return;
      }

      const res = await fetch("/api/transaction/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          type: tx.type === "transfer" ? "Send" : (tx.type === "trade" ? "Buy" : "Rebalance"),
          token: tx.token || "USDC",
          amount: tx.amount || "0",
          price: tx.type === "trade" ? "2450.00" : "1.00",
          recipient: tx.recipient,
          targetAllocation: tx.targetAllocation,
          traderAddress: tx.traderAddress,
          onChainHash: hash || undefined
        })
      });

      if (res.ok) {
        const outcome = await res.json();
        
        // Update the specific message to replace Pending with Receipt
        setMessages(prev => prev.map(m => {
          if (m.id === mId) {
            return {
              ...m,
              pendingTx: undefined, // remove pending card
              txReceipt: {
                txHash: outcome.tx?.txHash || hash || "0x",
                recipient: tx.recipient,
                amount: tx.amount,
                token: tx.token,
                status: "Success"
              }
            };
          }
          return m;
        }));

        onTransactionLogged(); // Notify parent to sync faucet offsets/balances immediately
      } else {
        const errResponse = await res.json().catch(() => ({}));
        setSigningError(errResponse.error || "Failed registration of on-chain event.");
      }
    } catch (err: any) {
      console.error("Outer executor sequence exception:", err);
      setSigningError(`Process Exception: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
      setSigningMessageId(null);
      setPendingTxToConfirm(null);
      setActiveMessageId(null);
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-[#001a1a] text-white p-4 sm:p-6 pb-16 font-sans relative">
      <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)]">
        
        {/* Module Header block */}
        <div className="p-4 rounded-2xl bg-[#002e2e]/30 border border-[#00f5d4]/10 flex items-center justify-between mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 filter drop-shadow-[0_0_6px_rgba(56,189,248,0.3)] animate-pulse" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="tab-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="tab-head-gradient" x1="80" y1="35" x2="80" y2="135" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>
                  <linearGradient id="tab-screen-gradient" x1="80" y1="52" x2="80" y2="122" gradientUnits="userSpaceOnUse">
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
                <rect x="26" y="38" width="108" height="92" rx="42" fill="url(#tab-head-gradient)" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Inner Faceplate Screen */}
                <rect x="36" y="48" width="88" height="72" rx="30" fill="url(#tab-screen-gradient)" stroke="#1e293b" strokeWidth="2" />
                
                {/* Inner Blue screen accent ring */}
                <rect x="38" y="50" width="84" height="68" rx="28" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.8" />

                {/* Glowing Eyes */}
                <rect x="58" y="68" width="8" height="24" rx="4" fill="#38bdf8" filter="url(#tab-neon-glow)" />
                <rect x="60" y="70" width="4" height="20" rx="2" fill="#ffffff" />

                <rect x="94" y="68" width="8" height="24" rx="4" fill="#38bdf8" filter="url(#tab-neon-glow)" />
                <rect x="96" y="70" width="4" height="20" rx="2" fill="#ffffff" />

                {/* Smiling mouth */}
                <path d="M70 98 C73 104, 87 104, 90 98" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#tab-neon-glow)" />
                <path d="M70 98 C73 104, 87 104, 90 98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Arc AI Companion Assistant</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="text-[10px] bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 hover:border-red-400/40 text-red-300 px-3 py-1 rounded-xl transition duration-150 font-bold shadow-sm cursor-pointer select-none"
            >
              New Chat
            </button>
            <span className="text-[10px] font-mono select-none px-2 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
              SECURE PORT
            </span>
          </div>
        </div>

        {/* Chat Stream thread viewport */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            const senderLabel = isUser 
              ? (email2FA ? email2FA.split("@")[0] : "Human") 
              : "Arc Companion";

            return (
              <div 
                key={m.id} 
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
              >
                {/* Sender label */}
                <span className={`text-[10px] font-bold tracking-wide uppercase px-1 ${
                  isUser ? "text-indigo-400" : "text-teal-400"
                }`}>
                  {senderLabel}
                </span>

                {/* Message capsule */}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser 
                    ? "bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-tr-none" 
                    : "bg-white/[0.04] text-gray-200 border border-white/5 rounded-tl-none"
                }`}>
                  <div>{m.text}</div>
                  {m.retryPrompt && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1.5">
                      <div className="text-[10px] text-gray-400 italic">Prompt: "{m.retryPrompt}"</div>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(m.retryPrompt!)}
                        className="self-start py-1 px-2.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] font-bold transition-colors select-none cursor-pointer"
                      >
                        Retry Command
                      </button>
                    </div>
                  )}
                </div>

                {/* Timestamp label */}
                <span className="text-[9px] text-gray-500 font-mono px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

              {/* ACTION: Pending Transaction Confirmation Ticket */}
              {m.sender === "agent" && m.pendingTx && (
                <div className="mt-2 w-full max-w-sm rounded-xl bg-[#0e2124] border border-teal-500/30 p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-300 border-b border-teal-500/10 pb-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400 animate-pulse" />
                    Action Intent Confirmation Ticket
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Operation:</span>
                      <span className="font-bold text-gray-200 capitalize">{m.pendingTx.type}</span>
                    </div>
                    {m.pendingTx.recipient && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recipient Contact:</span>
                        <span className="font-semibold text-teal-400">{m.pendingTx.recipient}</span>
                      </div>
                    )}
                    {m.pendingTx.amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Asset Amount:</span>
                        <span className="font-bold text-white">{m.pendingTx.amount} {m.pendingTx.token || "USDC"}</span>
                      </div>
                    )}
                    {m.pendingTx.traderAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trader Model:</span>
                        <span className="font-mono text-[10px] text-gray-300">{truncateHash(m.pendingTx.traderAddress)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-teal-500/5 pt-1.5">
                      <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Estimated Provider Gas:</span>
                      <span className="font-mono text-[10px] text-gray-400">{m.pendingTx.estimatedGas}</span>
                    </div>
                  </div>

                  {signingError && activeMessageId === m.id && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-normal font-medium">
                      <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Signature Failed
                      </div>
                      {signingError}
                    </div>
                  )}

                  {!isWagmiConnected && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-normal font-medium">
                      <div className="font-bold flex items-center gap-1.5 text-amber-400 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Wallet Disconnected
                      </div>
                      Please connect your MetaMask or on-chain Web3 wallet at the top of the interface first to authorize this on-chain transaction.
                    </div>
                  )}

                  <button
                    id={`confirm-sign-btn-${m.id}`}
                    disabled={signingMessageId === m.id}
                    onClick={() => handleInitiateConfirmAndSign(m.pendingTx, m.id)}
                    className="w-full py-2 px-4 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:bg-gray-700 disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed active:scale-95 transition-all text-black text-xs font-extrabold shadow-lg shadow-teal-500/20 text-center flex items-center justify-center gap-1.5"
                  >
                    {signingMessageId === m.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        Waiting for MetaMask Sign...
                      </>
                    ) : (
                      "Confirm & Sign Auth"
                    )}
                  </button>
                </div>
              )}

              {/* ACTION: Execution Receipt On-chain Ticket */}
              {m.sender === "agent" && m.txReceipt && (
                <div className="mt-2 w-full max-w-sm rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    On-chain Transaction Executed
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-emerald-400 font-bold uppercase">{m.txReceipt.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ledger Hash:</span>
                      <span className="text-white select-all">{truncateHash(m.txReceipt.txHash)}</span>
                    </div>
                  </div>

                  <a
                    href={`https://testnet.arcscan.app/tx/${m.txReceipt.txHash}`}
                    target="_blank"
                    rel="noreferrer referrer"
                    className="w-full py-2 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    View on Arcscan
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          );
        })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pl-1 animate-pulse">
              <span className="flex space-x-1">
                <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span>{loadingText}</span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input box bottom bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            id="chat-input-field"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type natural crypto commands..."
            className="flex-1 py-3 px-4 rounded-xl bg-black border border-white/10 focus:border-teal-500/50 outline-none text-xs text-white"
          />
          <button
            id="chat-submit-btn"
            type="submit"
            disabled={!userInput.trim()}
            className="p-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-40 active:scale-95 transition-all text-black flex items-center justify-center shadow-lg shadow-teal-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Suggested Prompt click board helper */}
        <div className="mt-3.5">
          <p className="text-[10px] text-gray-400 pb-1.5 uppercase font-bold tracking-widest pl-1">
            Commands Preset
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {suggestChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                className="py-1 px-3.5 rounded-full text-[10px] font-semibold bg-[#001f1f] hover:bg-teal-500/10 border border-[#00f5d4]/10 hover:border-teal-500/40 text-teal-300 transition-all text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Authenticator Challenge Overlay Modal */}
        {otpmode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div id="otp-dialog" className="w-full max-w-sm rounded-2xl bg-[#091414] border border-teal-500/40 p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 mb-3 animate-pulse">
                  <ShieldCheck className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-sm font-bold">2-Factor Authentication OTP Verification</h3>
                <p className="text-[11px] text-gray-400 mt-1.5 px-2">
                  To complete signing permission, verify the passcode dispatched to: <span className="text-teal-400 underline">{email2FA}</span>
                </p>
              </div>

              {otpError && (
                <div className="p-2.5 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs text-center font-mono">
                  {otpError}
                </div>
              )}

              {/* OTP Input block */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">
                  6-Digit Challenge Security PIN
                </label>
                <input
                  id="otp-challenge-input"
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                  placeholder="------"
                  className="w-full py-2.5 px-4 bg-black border border-white/10 text-center tracking-widest text-lg font-mono text-white rounded-xl focus:border-teal-500 outline-none"
                />
              </div>

              {/* Dev aid info box to pass validation instantly */}
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-200 leading-relaxed font-mono">
                <span className="font-bold uppercase tracking-wider block">Verification Helper Code:</span>
                Verification pinpoint issued: <span className="underline select-all font-bold text-white">{otpSentCode}</span> (Also check backend console log).
              </div>

              <div className="flex gap-2">
                <button
                  id="otp-cancel-btn"
                  onClick={() => { setOtpMode(false); setOtpValue(""); }}
                  className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-400"
                >
                  Cancel
                </button>
                <button
                  id="otp-verify-btn"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpValue.length !== 6}
                  className="flex-1 py-2 rounded bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-black text-xs font-extrabold flex items-center justify-center"
                >
                  {otpLoading ? "Verifying..." : "Verify & Sign"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
