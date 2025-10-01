'use client';

import { useState, useEffect } from 'react';

interface DemoPosition {
  symbol: string;
  amount: number;
  value: number;
  change24h: number;
}

export function PortfolioDemo() {
  const [demoPositions, setDemoPositions] = useState<DemoPosition[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const savedDemo = localStorage.getItem('alpha/demo-portfolio');
    if (savedDemo) {
      setDemoPositions(JSON.parse(savedDemo));
      setIsDemo(true);
    }
  }, []);

  const seedDemo = () => {
    // Simulate price data using existing price adapter
    const positions: DemoPosition[] = [
      { symbol: 'BTC', amount: 0.5, value: 22500, change24h: 2.3 },
      { symbol: 'ETH', amount: 5, value: 11250, change24h: -1.2 }
    ];
    
    setDemoPositions(positions);
    setIsDemo(true);
    localStorage.setItem('alpha/demo-portfolio', JSON.stringify(positions));
  };

  const resetDemo = () => {
    setDemoPositions([]);
    setIsDemo(false);
    localStorage.removeItem('alpha/demo-portfolio');
  };

  const totalValue = demoPositions.reduce((sum, pos) => sum + pos.value, 0);
  const totalChange = demoPositions.reduce((sum, pos) => sum + (pos.value * pos.change24h / 100), 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

  return (
    <div className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">📊 Portfolio {isDemo && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">Demo</span>}</h3>
      </div>

      {!isDemo ? (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-6">Connect your wallet to start tracking</div>
          <div className="flex gap-4 justify-center">
            <button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 px-8 py-4 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg">
              Connect Wallet
            </button>
            <button 
              onClick={seedDemo}
              className="cta-secondary px-8 py-4 rounded-xl font-semibold"
            >
              Try Demo
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <div className="text-2xl font-bold text-white">
              ${totalValue.toLocaleString()}
            </div>
            <div className={`text-sm ${totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalChangePercent >= 0 ? '+' : ''}${totalChange.toFixed(2)} ({totalChangePercent.toFixed(2)}%) 24h
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {demoPositions.map(position => (
              <div key={position.symbol} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {position.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{position.symbol}</div>
                    <div className="text-slate-400 text-sm">{position.amount} {position.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">${position.value.toLocaleString()}</div>
                  <div className={`text-sm ${position.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.change24h >= 0 ? '+' : ''}{position.change24h}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={resetDemo}
              className="cta-tertiary"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}