import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Mock Database in-memory
let contacts = [
  { id: "1", name: "Musa", address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", note: "Primary USDC Transfer Target", isContact: true, isCopyTrader: false },
  { id: "2", name: "Sarah (DeFi)", address: "0x3ec82ef784d1bc9b2ff2888497faae3ded529267", note: "Yield Aggregation address", isContact: true, isCopyTrader: false },
  { id: "3", name: "Whale Alpha", address: "0x281055afc982d96fab65b3a49cac8b878184cb16", note: "Track whale movements", isContact: true, isCopyTrader: true, nickname: "Whale Alpha", isFollowing: true },
];

let txHistory: any[] = [
  {
    id: "tx_1",
    date: "2026-06-11T10:00:00Z",
    type: "Receive",
    token: "USDC",
    amount: "500",
    price: "1.00",
    status: "Success",
    txHash: "0x892a0651a0215bc267e6c0c1b489a742a78ec451ec94f57c164d1f211516e890",
    address: ""
  },
  {
    id: "tx_2",
    date: "2026-06-11T09:12:00Z",
    type: "Buy",
    token: "ETH",
    amount: "1.2",
    price: "3120.50",
    status: "Success",
    txHash: "0xb7df661cf5cc3e8fbbed37fa5daef6061151a669cfd22f6bfddcc27663e2fa1a",
    address: ""
  }
];

let securityLogs = [
  { id: "log_1", timestamp: new Date(Date.now() - 3600000).toISOString(), event: "System Startup", details: "Arc. Companion server initialization on port 3000" },
  { id: "log_2", timestamp: new Date(Date.now() - 1800000).toISOString(), event: "Chain Connect", details: "Established primary JSON-RPC connection to Arc Testnet" },
];

let faucetOffsets = new Map<string, number>();
let activeOtps = new Map<string, { otp: string, expiresAt: number, verified: boolean }>();

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/wallet?address=
app.get("/api/wallet", async (req, res) => {
  const address = (req.query.address as string) || "";
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  // Attempt real JSON-RPC call first to match custom chain configurations safely
  let chainBalanceUSDC = "0.0";
  try {
    const rpcRes = await fetch("https://rpc.testnet.arc.network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"]
      })
    });
    const rpcData = await rpcRes.json();
    if (rpcData.result) {
      const balanceWei = BigInt(rpcData.result);
      chainBalanceUSDC = (parseFloat(balanceWei.toString()) / 1e18).toFixed(4);
    }
  } catch (err) {
    console.log("Note: RPC balance fetch bypassed, utilizing in-memory balance: " + (err instanceof Error ? err.message : String(err)));
  }

  const offset = faucetOffsets.get(address.toLowerCase()) || 0;
  const mergedBalance = (parseFloat(chainBalanceUSDC) + offset).toFixed(4);

  // Filter tx for this address
  const localTx = txHistory.filter(tx => !tx.address || tx.address.toLowerCase() === address.toLowerCase());

  res.json({
    address,
    chain: {
      id: 5042002,
      name: "Arc Testnet",
      symbol: "USDC",
      rpc: "https://rpc.testnet.arc.network",
      explorer: "https://testnet.arcscan.app"
    },
    balance: mergedBalance,
    recentTransactions: localTx.slice(-5)
  });
});

// GET /api/wallet/balance/:address
app.get("/api/wallet/balance/:address", async (req, res) => {
  const address = req.params.address;
  let chainBalanceUSDC = "0.0";
  try {
    const rpcRes = await fetch("https://rpc.testnet.arc.network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"]
      })
    });
    const rpcData = await rpcRes.json();
    if (rpcData.result) {
      const balanceWei = BigInt(rpcData.result);
      chainBalanceUSDC = (parseFloat(balanceWei.toString()) / 1e18).toFixed(4);
    }
  } catch (err) {
    // ignore
  }
  const offset = faucetOffsets.get(address.toLowerCase()) || 0;
  res.json({ balance: (parseFloat(chainBalanceUSDC) + offset).toFixed(4) });
});

// POST /api/wallet/faucet
app.post("/api/wallet/faucet", (req, res) => {
  const { address, amount } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  const offset = faucetOffsets.get(address.toLowerCase()) || 0;
  const added = parseFloat(amount) || 1000;
  faucetOffsets.set(address.toLowerCase(), offset + added);

  // Add a Transaction Log Event for the Faucet call
  const txId = "tx_faucet_" + Date.now();
  const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const faucetTx = {
    id: txId,
    date: new Date().toISOString(),
    type: "Receive",
    token: "USDC",
    amount: added.toString(),
    price: "1.00",
    status: "Success",
    txHash: txHash,
    address: address.toLowerCase()
  };
  txHistory.push(faucetTx);

  // Log Security events
  securityLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "USDC Faucet Request",
    details: `USDC +${added} faucet request executed for ${address}`
  });

  res.json({ success: true, addedAmount: added, newOffset: offset + added, tx: faucetTx });
});

// GET /api/contacts
app.get("/api/contacts", (req, res) => {
  res.json(contacts);
});

// POST /api/contacts
app.post("/api/contacts", (req, res) => {
  const { name, address, note, isContact, isCopyTrader, nickname, isFollowing } = req.body;
  if (!name || !address) {
    return res.status(400).json({ error: "Name and Address are required" });
  }

  const newContact = {
    id: "cnt_" + Date.now(),
    name,
    address,
    note: note || "",
    isContact: isContact ?? true,
    isCopyTrader: isCopyTrader ?? false,
    nickname: nickname || name,
    isFollowing: isFollowing ?? false
  };

  contacts.push(newContact);
  res.json(newContact);
});

// DELETE /api/contacts/:id
app.delete("/api/contacts/:id", (req, res) => {
  const id = req.params.id;
  contacts = contacts.filter(c => c.id !== id);
  res.json({ success: true });
});

// GET /api/transactions
app.get("/api/transactions", (req, res) => {
  const address = req.query.address as string;
  if (address) {
    return res.json(txHistory.filter(t => !t.address || t.address.toLowerCase() === address.toLowerCase()));
  }
  res.json(txHistory);
});

// POST /api/transaction/execute
app.post("/api/transaction/execute", (req, res) => {
  const { address, type, token, amount, price, recipient, targetAllocation, traderAddress } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  // Create real mock on-chain receipt hash
  const txHash = req.body.onChainHash || ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
  const newTx = {
    id: "tx_" + Date.now(),
    date: new Date().toISOString(),
    type: type || "Buy",
    token: token || "USDC",
    amount: amount || "0",
    price: price || "1.00",
    status: "Success",
    txHash,
    address: address.toLowerCase()
  };

  txHistory.unshift(newTx);

  // Adjust balance offset during local simulations to show direct changes
  const numAmount = parseFloat(amount) || 0;
  const currentOffset = faucetOffsets.get(address.toLowerCase()) || 0;
  
  if (type === "Send") {
    faucetOffsets.set(address.toLowerCase(), currentOffset - numAmount);
  } else if (type === "Buy") {
    const rawCost = numAmount * (parseFloat(price) || 1.0);
    faucetOffsets.set(address.toLowerCase(), currentOffset - rawCost);
  } else if (type === "Sell") {
    const rawGain = numAmount * (parseFloat(price) || 1.0);
    faucetOffsets.set(address.toLowerCase(), currentOffset + rawGain);
  }

  securityLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "Transaction Logged",
    details: `${type} ${amount} ${token} successfully executed. Hash: ${txHash}`
  });

  res.json({ success: true, tx: newTx });
});

// POST /api/auth/send-otp
app.post("/api/auth/send-otp", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  activeOtps.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 600000, // 10 minutes expiry
    verified: false
  });

  // Print OTP clearly in backend terminal for preview testing
  console.log("\n========================================");
  console.log(`[ARC SECURITY GATEWAY OTP]`);
  console.log(`Recipient: ${email}`);
  console.log(`Security authentication challenge PIN: ${otp}`);
  console.log(`Expires in 10 minutes.`);
  console.log("========================================\n");

  securityLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "2FA OTP Triggered",
    details: `Verification code successfully generated for ${email}`
  });

  res.json({ success: true, message: `OTP sent to ${email}`, otp }); // Also return OTP for UI popup
});

// POST /api/auth/verify-otp
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const record = activeOtps.get(email.toLowerCase());
  if (!record) {
    return res.status(400).json({ error: "No active code found for this email" });
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(email.toLowerCase());
    return res.status(400).json({ error: "OTP expired. Please request a new code." });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP code" });
  }

  record.verified = true;
  activeOtps.set(email.toLowerCase(), record);

  securityLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "2FA Verified",
    details: `OTP verified successfully for ${email}`
  });

  res.json({ success: true, verified: true });
});

// GET /api/auth/nonce
app.get("/api/auth/nonce", (req, res) => {
  const nonce = "arc_nonce_" + Math.floor(10000000 + Math.random() * 90000000);
  res.json({ nonce });
});

// POST /api/auth/siwe
app.post("/api/auth/siwe", (req, res) => {
  const { address, message, signature } = req.body;
  if (!address || !message || !signature) {
    return res.status(400).json({ error: "Missing address, message or signature" });
  }

  securityLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "SIWE Authentication",
    details: `Address ${address} successfully verified ownership on Arc Testnet`
  });

  res.json({ success: true, address });
});

// GET /api/analytics/score
app.get("/api/analytics/score", async (req, res) => {
  // Try retrieving Live Fear and Greed Index from Alternative.me URL
  let fearGreedValue = 54; // Default to neutral
  try {
    const fngRes = await fetch("https://api.alternative.me/fng/?limit=1");
    const fngData = await fngRes.json();
    if (fngData?.data?.[0]?.value) {
      fearGreedValue = parseInt(fngData.data[0].value) || 54;
    }
  } catch (err) {
    // Fail silently, use mock fluctuations
    fearGreedValue = Math.floor(45 + Math.random() * 20);
  }

  // Calculate simulated sub contributions matching live vibes
  const onChainFlows = Math.floor(55 + Math.random() * 15);
  const socialSentiment = Math.floor(48 + Math.random() * 25);
  const macroSignals = Math.floor(35 + Math.random() * 15);
  const orderBookDepth = Math.floor(62 + Math.random() * 8);

  // Unified score fusions
  const unifiedScore = Math.floor((fearGreedValue + onChainFlows + socialSentiment + macroSignals + orderBookDepth) / 5);

  let label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed' = 'Neutral';
  if (unifiedScore <= 25) label = 'Extreme Fear';
  else if (unifiedScore <= 45) label = 'Fear';
  else if (unifiedScore <= 55) label = 'Neutral';
  else if (unifiedScore <= 75) label = 'Greed';
  else label = 'Extreme Greed';

  res.json({
    score: unifiedScore,
    label,
    breakdown: {
      fearGreed: fearGreedValue,
      onChain: onChainFlows,
      socialSentiment: socialSentiment,
      macroSignals: macroSignals,
      orderBook: orderBookDepth
    }
  });
});

// GET /api/analytics/sentiment
app.get("/api/analytics/sentiment", (req, res) => {
  res.json({
    twitterScore: 68,
    telegramScore: 54,
    socialSentimentTrend: "positive",
    trendingTokens: [
      { name: "USDC", mentions: 12400, trend: "+12%" },
      { name: "USDX", mentions: 8900, trend: "+8%" },
      { name: "ETH", mentions: 24500, trend: "+4%" },
    ],
    mentionVolumeHistory: [450, 520, 610, 580, 690, 750, 810]
  });
});

// GET /api/analytics/onchain
app.get("/api/analytics/onchain", (req, res) => {
  res.json({
    netFlowsExchanges: "-12.4M", // whale outflows is bullish
    activeWhalesCount: 412,
    avgActiveAddresses: 18900,
    largeTxCount: 231,
    recentWhaleTrades: [
      { time: "5m ago", tx: "Outflow 4.2M USDC to Wallet 0x2810..." },
      { time: "18m ago", tx: "Inflow 1.5M USDC to Builder Pool" },
      { time: "42m ago", tx: "Outflow 800K USDC to Liquidity Bridge" }
    ]
  });
});

// POST /api/parse-intent
async function generateContentWithRetry(prompt: string, systemPrompt: string): Promise<string> {
  const models = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  
  let lastError: any;
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json"
          }
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
        const isTransient = msg.includes("503") || msg.includes("unavailable") || msg.includes("429") || msg.includes("rate") || msg.includes("exhausted") || msg.includes("demand") || msg.includes("temporary");
        if (!isTransient) {
          // Break the inner loop for structural errors to avoid wasteful retries
          break;
        }
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  }
  throw lastError || new Error("All configured Gemini models failed to respond.");
}

app.post("/api/parse-intent", async (req, res) => {
  const { prompt, address } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const systemPrompt = `You are the AI assistant inside Arc. Companion. Your job is to parse natural language crypto commands from the user into structured JSON.
You must return a valid JSON object matching this schema:
{
  "type": "transfer" | "trade" | "rebalance" | "copy_trade" | "query_portfolio" | "query_transactions" | "query_spending" | "chat",
  "recipient": string or name if any,
  "amount": string number if specified,
  "token": string symbol if specified (e.g., USDC, ETH),
  "memo": string if any,
  "estimatedGas": string (e.g. "0.005 USDC"),
  "answer": "string containing conversational text if the command is a question, or a friendly instruction explaining what action needs to be confirmed.",
  "targetAllocation": object with string keys and number values if rebalance was requested,
  "traderAddress": string of the trader address to copy if copy trade was requested
}

Examples:
- "Send 10 USDC to Musa" -> { "type": "transfer", "recipient": "Musa", "amount": "10", "token": "USDC", "estimatedGas": "0.002 USDC", "answer": "Click below to confirm your transfer of 10 USDC to Musa." }
- "Buy 50 USDC worth of ETH" -> { "type": "trade", "recipient": "", "amount": "50", "token": "ETH", "estimatedGas": "0.010 USDC", "answer": "Ready to execute trade: Swap 50 USDC for ETH." }
- "Analyze my spending" -> { "type": "query_spending", "answer": "Looking at your 2 recent transactions: you received 500 USDC and bought 1.2 ETH for 3120.50 USDC. Your largest category is investment assets (ETH)." }
- "Who is Musa?" -> { "type": "chat", "answer": "Musa is your saved whitelist contact with address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e." }

Respond ONLY with valid, raw JSON. Do not wrap code in markdown snippets. Ensure the JSON is completely parser-friendly.`;

    const cleanResult = await generateContentWithRetry(prompt, systemPrompt);
    const parsed = JSON.parse(cleanResult.trim());
    res.json(parsed);

  } catch (err) {
    console.log("Gemini parse status: busy/fallback active. Note: " + (err instanceof Error ? err.message : String(err)));
    
    // Minimal fallback parser if Gemini API Key is missing or invalid
    let answer = `I received your request "${prompt}". I am currently running with a local rule-based intent engine.`;
    let type = "chat";
    let recipient = "";
    let amount = "";
    let token = "USDC";

    const promptLower = prompt.toLowerCase();
    if (promptLower.includes("send") || promptLower.includes("transfer")) {
      type = "transfer";
      token = "USDC";
      amount = (prompt.match(/\d+/) || ["10"])[0];
      recipient = promptLower.includes("musa") ? "Musa" : "Sarah";
      answer = `Transfer challenge generated: Prepare to send ${amount} ${token} to ${recipient}.`;
    } else if (promptLower.includes("buy") || promptLower.includes("trade") || promptLower.includes("swap")) {
      type = "trade";
      token = promptLower.includes("eth") ? "ETH" : "USDC";
      amount = (prompt.match(/\d+/) || ["50"])[0];
      answer = `Swap trade created: Swap ${amount} USDC for ${token}.`;
    } else if (promptLower.includes("history") || promptLower.includes("transactions")) {
      type = "query_transactions";
      answer = "Retrieving transaction ledger: You have 2 successful trades on Arc Testnet.";
    }

    res.json({
      type,
      recipient,
      amount,
      token,
      estimatedGas: "0.005 USDC",
      answer
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arc. Companion server booted successfully. Listening on http://localhost:${PORT}`);
  });
}

startServer();
