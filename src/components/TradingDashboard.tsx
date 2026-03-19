import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, 
  Play, Square, History, BarChart3, 
  ShieldCheck, Zap, Info
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { MarketData, Trade, FundamentalAnalysis } from '../types';
import { analyzeMarket } from '../services/geminiService';

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'AAPL', 'TSLA'];

export default function TradingDashboard() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [analysis, setAnalysis] = useState<FundamentalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [balance, setBalance] = useState(10000);

  // Mock Market Data Stream
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = SYMBOLS.map(symbol => {
          const last = prev.find(d => d.symbol === symbol);
          const basePrice = last?.price || (symbol.includes('USD') ? 50000 : 150);
          const change = (Math.random() - 0.5) * (basePrice * 0.002);
          const newPrice = basePrice + change;
          
          return {
            symbol,
            price: Number(newPrice.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(((change / basePrice) * 100).toFixed(2)),
            volume: (Math.random() * 1000).toFixed(2) + 'M',
            timestamp: Date.now()
          };
        });
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const currentData = marketData.find(d => d.symbol === selectedSymbol);

  const executeTrade = useCallback(async (type: 'BUY' | 'SELL', market: MarketData, analysisResult: FundamentalAnalysis) => {
    const risk = market.price * 0.01; // 1% risk
    const reward = risk * 2; // 2:1 ratio
    
    const stopLoss = type === 'BUY' ? market.price - risk : market.price + risk;
    const takeProfit = type === 'BUY' ? market.price + reward : market.price - reward;

    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: market.symbol,
      type,
      entryPrice: market.price,
      stopLoss,
      takeProfit,
      status: 'OPEN',
      timestamp: Date.now(),
      analysis: analysisResult.reasoning
    };

    setTrades(prev => [newTrade, ...prev]);

    // Simulate trade outcome after 5-10 seconds
    setTimeout(() => {
      const win = Math.random() > 0.45; // 55% win rate simulation for "expert"
      const profit = win ? reward : -risk;
      
      setTrades(prev => prev.map(t => 
        t.id === newTrade.id 
          ? { ...t, status: 'CLOSED', exitPrice: win ? takeProfit : stopLoss, profit } 
          : t
      ));
      setBalance(prev => prev + profit);
    }, 8000);
  }, []);

  const runAutoTrading = useCallback(async () => {
    if (!currentData || !isAutoTrading || isAnalyzing) return;

    setIsAnalyzing(true);
    const result = await analyzeMarket(currentData);
    setAnalysis(result);
    setIsAnalyzing(false);

    if (result.recommendation === 'BUY' || result.recommendation === 'SELL') {
      executeTrade(result.recommendation as 'BUY' | 'SELL', currentData, result);
    }
  }, [currentData, isAutoTrading, isAnalyzing, executeTrade]);

  useEffect(() => {
    if (isAutoTrading) {
      const timer = setTimeout(runAutoTrading, 10000);
      return () => clearTimeout(timer);
    }
  }, [isAutoTrading, runAutoTrading]);

  return (
    <div className="min-h-screen p-6 trading-grid">
      <header className="flex justify-between items-center mb-8 bg-[--color-card] p-4 rounded-2xl border border-[--color-border] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Zap className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TradeMind AI</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Expert Fundamentalist System</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-mono">Account Balance</p>
            <p className="text-xl font-bold text-emerald-400">${balance.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setIsAutoTrading(!isAutoTrading)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
              isAutoTrading 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isAutoTrading ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {isAutoTrading ? 'STOP AUTO' : 'START AUTO'}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Market Overview */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-[--color-card] p-6 rounded-3xl border border-[--color-border] shadow-xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <select 
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-transparent text-2xl font-bold border-none focus:ring-0 cursor-pointer"
                >
                  {SYMBOLS.map(s => <option key={s} value={s} className="bg-[#141416]">{s}</option>)}
                </select>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-mono font-bold">${currentData?.price || '0.00'}</span>
                  <span className={`text-sm font-bold flex items-center ${currentData && currentData.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentData && currentData.change >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                    {currentData?.changePercent}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {['1M', '5M', '15M', '1H', '1D'].map(t => (
                  <button key={t} className="px-3 py-1 text-xs font-mono rounded-md hover:bg-white/5 border border-white/5 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketData.filter(d => d.symbol === selectedSymbol)}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232326" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: '#475569', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#141416', border: '1px solid #232326', borderRadius: '12px'}}
                    itemStyle={{color: '#3b82f6'}}
                  />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Analysis Card */}
          <div className="bg-[--color-card] p-6 rounded-3xl border border-[--color-border] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-blue-400" size={20} />
              <h2 className="font-bold">AI Fundamental Analysis</h2>
              {isAnalyzing && (
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-xs text-blue-400 font-mono ml-auto"
                >
                  ANALYZING MARKET...
                </motion.div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div 
                  key="analysis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        analysis.sentiment === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 
                        analysis.sentiment === 'BEARISH' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {analysis.sentiment}
                      </span>
                      <span className="text-slate-500 text-sm">Score: {analysis.score}/100</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "{analysis.reasoning}"
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyFactors.map((f, i) => (
                        <span key={i} className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-400 uppercase font-mono">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <p className="text-xs text-slate-500 uppercase font-mono mb-2">Recommendation</p>
                    <p className={`text-2xl font-black ${
                      analysis.recommendation === 'BUY' ? 'text-emerald-400' : 
                      analysis.recommendation === 'SELL' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {analysis.recommendation}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-500">
                      <ShieldCheck size={12} />
                      <span>2:1 Risk/Reward Ratio Applied</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                  <Info size={40} className="mb-2 opacity-20" />
                  <p>Aguardando próxima janela de análise...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar: Recent Trades */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[--color-card] p-6 rounded-3xl border border-[--color-border] shadow-xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <History className="text-slate-400" size={20} />
              <h2 className="font-bold">Live Operations</h2>
              <span className="ml-auto text-[10px] bg-white/5 px-2 py-1 rounded font-mono text-slate-500">
                {trades.length} TOTAL
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {trades.map((trade) => (
                  <motion.div 
                    key={trade.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-sm">{trade.symbol}</span>
                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </div>
                      <span className={`text-xs font-mono ${trade.status === 'OPEN' ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`}>
                        {trade.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 mb-3">
                      <div>Entry: ${trade.entryPrice}</div>
                      <div>SL: ${trade.stopLoss.toFixed(2)}</div>
                      <div>TP: ${trade.takeProfit.toFixed(2)}</div>
                      {trade.exitPrice && <div>Exit: ${trade.exitPrice.toFixed(2)}</div>}
                    </div>

                    {trade.status === 'CLOSED' && (
                      <div className={`text-sm font-bold flex items-center justify-end ${trade.profit! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.profit! >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {trades.length === 0 && (
                <div className="text-center py-20 text-slate-600">
                  <BarChart3 size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm italic">Nenhuma operação aberta.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
