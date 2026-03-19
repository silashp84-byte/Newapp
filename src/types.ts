export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  status: 'OPEN' | 'CLOSED';
  profit?: number;
  timestamp: number;
  analysis: string;
}

export interface FundamentalAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  reasoning: string;
  keyFactors: string[];
  recommendation: string;
}
