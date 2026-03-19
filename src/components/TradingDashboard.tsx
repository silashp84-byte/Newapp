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

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'EUR/USD', 'AAPL', 'TSLA'];

export default function TradingDashboard() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [analyses, setAnalyses] = useState<Record<string, FundamentalAnalysis>>({});
  const [analyzingSymbols, setAnalyzingSymbols] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState(10000);
  const [viewMode, setViewMode] = useState<'GRID' | 'SINGLE'>('GRID');
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);

  // Mock Market Data Stream
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        return SYMBOLS.map(symbol => {
          const last = prev.find(d => d.symbol === symbol);
          const basePrice = last?.price || (symbol.includes('USD') || symbol.includes('/') ? (symbol.startsWith('BTC') ? 65000 : symbol.startsWith('ETH') ? 3500 : 150) : 150);
          const volatility = symbol.includes('BTC') || symbol.includes('SOL') ? 0.005 : 0.002;
          const change = (Math.random() - 0.5) * (basePrice * volatility);
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
      });
    }, 1000); // Faster updates

    return () => clearInterval(interval);
  }, []);

  const executeTrade = useCallback(async (type: 'BUY' | 'SELL', market: MarketData, analysisResult: FundamentalAnalysis) => {
    const risk = market.price * 0.005; // 0.5% risk for faster turnover
    const reward = risk * 2; // Strict 2:1
    
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

    // Faster simulation for "High Frequency" feel
    setTimeout(() => {
      const win = Math.random() > 0.48; 
      const profit = win ? reward : -risk;
      
      setTrades(prev => prev.map(t => 
        t.id === newTrade.id 
          ? { ...t, status: 'CLOSED', exitPrice: win ? takeProfit : stopLoss, profit } 
          : t
      ));
      setBalance(prev => prev + profit);
    }, 5000);
  }, []);

  const analyzeAllAssets = useCallback(async () => {
    if (!isAutoTrading) return;

    // Parallel analysis for all symbols
    SYMBOLS.forEach(async (symbol) => {
      const data = marketData.find(d => d.symbol === symbol);
      if (!data || analyzingSymbols.has(symbol)) return;

      setAnalyzingSymbols(prev => new Set(prev).add(symbol));
      
      try {
        const result = await analyzeMarket(data);
        setAnalyses(prev => ({ ...prev, [symbol]: result }));
        
        if (result.recommendation === 'BUY' || result.recommendation === 'SELL') {
          // Check if already have an open trade for this symbol to avoid over-exposure
          const hasOpenTrade = trades.some(t => t.symbol === symbol && t.status === 'OPEN');
          if (!hasOpenTrade) {
            executeTrade(result.recommendation as 'BUY' | 'SELL', data, result);
          }
        }
      } finally {
        setAnalyzingSymbols(prev => {
          const next = new Set(prev);
          next.delete(symbol);
          return next;
        });
      }
    });
  }, [marketData, isAutoTrading, analyzingSymbols, trades, executeTrade]);

  useEffect(() => {
    if (isAutoTrading) {
      const timer = setInterval(analyzeAllAssets, 5000); // Analyze every 5s
      return () => clearInterval(timer);
    }
  }, [isAutoTrading, analyzeAllAssets]);

  return (
    <div className="min-h-screen p-4 flex flex-col gap-4 relative overflow-hidden bg-[#08090a]">
      <div className="scanline" />
      
      {/* Background Particles */}
      {[...Array(15)].map((_, i) => (
        <div 
          key={i} 
          className="data-particle" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} 
        />
      ))}

      {/* Technical Overlays */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-10 left-10 font-mono text-[8px] text-emerald-500 uppercase tracking-[0.5em]">
          System_Status: Optimal // Latency: 12ms
        </div>
        <div className="absolute bottom-10 right-10 font-mono text-[8px] text-emerald-500 uppercase tracking-[0.5em]">
          Coordinate_Sync: {Math.random().toFixed(4)} : {Math.random().toFixed(4)}
        </div>
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-1">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 h-px bg-emerald-500/20" />
          ))}
        </div>
      </div>
      
      <header className="flex justify-between items-center glass-panel p-4 rounded-2xl cyber-glow-cyan relative z-10">
        <div className="flex items-center gap-5">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <Zap className="text-emerald-400" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">TRADEMIND <span className="text-emerald-500 font-mono text-xs ml-1">PRO_TERMINAL</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">Neural Execution System // v3.2.0</p>
          </div>
          <div className="h-8 w-px bg-white/5 mx-2" />
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setViewMode('GRID')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'GRID' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              GRID
            </button>
            <button 
              onClick={() => setViewMode('SINGLE')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'SINGLE' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SINGLE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Available Equity</p>
            <p className="text-2xl font-bold text-white font-mono tracking-tighter">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <button 
            onClick={() => setIsAutoTrading(!isAutoTrading)}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${
              isAutoTrading 
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20' 
                : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20'
            }`}
          >
            {isAutoTrading ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            <span className="text-xs tracking-widest">{isAutoTrading ? 'STOP ENGINE' : 'ACTIVATE ENGINE'}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden relative z-10">
        {/* Main View Area */}
        <main className="col-span-12 lg:col-span-9 overflow-y-auto pr-1 custom-scrollbar">
          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {SYMBOLS.map(symbol => {
                const data = marketData.find(d => d.symbol === symbol);
                const analysis = analyses[symbol];
                const isAnalyzing = analyzingSymbols.has(symbol);
                
                return (
                  <motion.div 
                    key={symbol}
                    layout
                    className="glass-panel p-5 rounded-3xl hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1">{symbol}</h3>
                        <p className="text-2xl font-bold text-white font-mono tracking-tighter">${data?.price?.toLocaleString() || '0.00'}</p>
                      </div>
                      <div className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${data && data.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {data && data.change >= 0 ? '+' : ''}{data?.changePercent}%
                      </div>
                    </div>

                    <div className="h-28 w-full mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketData.filter(d => d.symbol === symbol)}>
                          <defs>
                            <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={data && data.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.2}/>
                              <stop offset="100%" stopColor={data && data.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke={data && data.change >= 0 ? '#10b981' : '#f43f5e'} 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill={`url(#grad-${symbol})`} 
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 min-h-[90px] flex flex-col justify-center">
                      {isAnalyzing ? (
                        <div className="flex items-center justify-center gap-3 text-[11px] text-emerald-400 font-bold uppercase tracking-widest">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                            <Activity size={14} />
                          </motion.div>
                          Processing...
                        </div>
                      ) : analysis ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${analysis.sentiment === 'BULLISH' ? 'text-emerald-400' : analysis.sentiment === 'BEARISH' ? 'text-rose-400' : 'text-slate-500'}`}>
                              {analysis.sentiment}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">CONF: {analysis.score}%</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium italic">
                            "{analysis.reasoning}"
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 font-bold uppercase tracking-widest">
                          <Activity size={14} className="opacity-20" />
                          Standby
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-12 xl:col-span-8 space-y-4">
                <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Zap size={200} />
                  </div>
                  
                  <div className="flex justify-between items-end mb-8 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <select 
                          value={selectedSymbol}
                          onChange={(e) => setSelectedSymbol(e.target.value)}
                          className="bg-transparent text-4xl font-bold border-none focus:ring-0 cursor-pointer text-white tracking-tighter"
                        >
                          {SYMBOLS.map(s => <option key={s} value={s} className="bg-[#0f1113]">{s}</option>)}
                        </select>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 tracking-widest">LIVE</div>
                      </div>
                      <p className="text-slate-500 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} /> Market Real-time Execution
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-6xl font-mono font-bold text-white tracking-tighter">
                        ${marketData.find(d => d.symbol === selectedSymbol)?.price?.toLocaleString() || '0.00'}
                      </p>
                      <p className={`text-sm font-bold mt-1 ${marketData.find(d => d.symbol === selectedSymbol)?.change! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {marketData.find(d => d.symbol === selectedSymbol)?.change! >= 0 ? '▲' : '▼'} {marketData.find(d => d.symbol === selectedSymbol)?.changePercent}%
                      </p>
                    </div>
                  </div>

                  <div className="h-[400px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={marketData.filter(d => d.symbol === selectedSymbol)}>
                        <defs>
                          <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2124" vertical={false} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: '#475569', fontSize: 11}} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0f1113', border: '1px solid #1e2124', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}
                          itemStyle={{color: '#10b981', fontWeight: 'bold'}}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#mainGrad)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Volatility', value: 'High', color: 'text-emerald-400' },
                    { label: 'Liquidity', value: 'Extreme', color: 'text-emerald-400' },
                    { label: 'Trend', value: 'Bullish', color: 'text-emerald-400' }
                  ].map((stat, i) => (
                    <div key={i} className="glass-panel p-4 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-12 xl:col-span-4 space-y-4">
                <div className="glass-panel p-6 rounded-[2rem] h-full flex flex-col">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BarChart3 size={14} /> Order Depth
                  </h3>
                  <div className="flex-1 space-y-1 font-mono text-[11px]">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center group cursor-default">
                        <span className="text-rose-500/70 group-hover:text-rose-400 transition-colors">{(100 + Math.random() * 5).toFixed(2)}</span>
                        <div className="flex-1 mx-4 h-1 bg-rose-500/5 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500/20" style={{ width: `${Math.random() * 100}%` }} />
                        </div>
                        <span className="text-slate-500">{(Math.random() * 10).toFixed(3)}</span>
                      </div>
                    ))}
                    <div className="py-3 border-y border-white/5 my-2 text-center text-white font-bold text-sm">
                      SPREAD: 0.002
                    </div>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center group cursor-default">
                        <span className="text-emerald-500/70 group-hover:text-emerald-400 transition-colors">{(99 - Math.random() * 5).toFixed(2)}</span>
                        <div className="flex-1 mx-4 h-1 bg-emerald-500/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500/20" style={{ width: `${Math.random() * 100}%` }} />
                        </div>
                        <span className="text-slate-500">{(Math.random() * 10).toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar: Operations & Stats */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="glass-panel p-5 rounded-3xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/5 p-2 rounded-lg">
                <History className="text-slate-400" size={16} />
              </div>
              <h2 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">Execution Log</h2>
              <span className="ml-auto text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                {trades.filter(t => t.status === 'OPEN').length} ACTIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              <AnimatePresence initial={false}>
                {trades.map((trade) => (
                  <motion.div 
                    key={trade.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                      trade.status === 'OPEN' 
                        ? 'bg-white/5 border-white/5' 
                        : trade.profit! >= 0 
                          ? 'bg-emerald-500/5 border-emerald-500/10' 
                          : 'bg-rose-500/5 border-rose-500/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-white">{trade.symbol}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {trade.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] text-slate-500 font-mono">
                        ENTRY: ${trade.entryPrice.toLocaleString()}
                      </div>
                      {trade.status === 'CLOSED' && (
                        <div className={`text-sm font-bold font-mono ${trade.profit! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.profit! >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {/* Progress bar for open trades */}
                    {trade.status === 'OPEN' && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/20 w-full">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 5, ease: "linear" }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-emerald-500 p-6 rounded-3xl text-black shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <BarChart3 size={100} />
            </div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <BarChart3 size={18} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]">Neural Performance</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Win Rate</p>
                <p className="text-2xl font-bold tracking-tighter">58.4%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Avg Profit</p>
                <p className="text-2xl font-bold tracking-tighter">+$42.10</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-black/10 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase opacity-60 mb-2">
                <span>Efficiency</span>
                <span>92%</span>
              </div>
              <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-black/40 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
