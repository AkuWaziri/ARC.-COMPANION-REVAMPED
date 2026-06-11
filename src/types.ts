export interface Contact {
  id: string;
  name: string;
  address: string;
  note: string;
  isContact: boolean;
  isCopyTrader: boolean;
  nickname?: string;
  isFollowing?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Buy' | 'Sell' | 'Send' | 'Receive' | 'Rebalance' | 'CopyTrade';
  token: string;
  amount: string;
  price: string;
  status: 'Success' | 'Failed' | 'Pending';
  txHash: string;
  address: string;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  event: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  retryPrompt?: string;
  pendingTx?: {
    type: 'transfer' | 'trade' | 'rebalance' | 'copy_trade';
    recipient?: string;
    amount?: string;
    token?: string;
    memo?: string;
    estimatedGas?: string;
    targetAllocation?: Record<string, number>;
    traderAddress?: string;
  };
  txReceipt?: {
    txHash: string;
    recipient?: string;
    amount?: string;
    token?: string;
    status: 'Success' | 'Failed';
  };
}

export interface UnifiedAnalyticsScore {
  score: number;
  label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  color: string;
  breakdown: {
    fearGreed: number;
    onChain: number;
    socialSentiment: number;
    macroSignals: number;
    orderBook: number;
  };
}
