'use client'

import { useState } from 'react'

export default function Lite5Portfolio5Page() {
  const [isConnected, setIsConnected] = useState(false)

  const handleConnectWallet = () => {
    // Mock wallet connection for demo purposes
    setIsConnected(true)
    alert('Wallet connected! (Demo mode)')
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">📊 Portfolio</h1>
        <p className="text-slate-400 mt-2">
          Track your crypto portfolio performance
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 shadow">
        <h2 className="text-xl font-semibold text-white mb-4">Portfolio Overview</h2>
        
        {!isConnected ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-slate-400">Connect your wallet to get started</p>
            <button 
              onClick={handleConnectWallet}
              className="mt-4 rounded-xl bg-teal-600 px-6 py-3 text-white font-semibold hover:bg-teal-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  ETH
                </div>
                <div>
                  <div className="font-semibold text-white">Ethereum</div>
                  <div className="text-sm text-slate-400">2.5 ETH</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-teal-400">$4,250.00</div>
                <div className="text-sm text-green-400">+12.5%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                  BTC
                </div>
                <div>
                  <div className="font-semibold text-white">Bitcoin</div>
                  <div className="text-sm text-slate-400">0.15 BTC</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-teal-400">$6,750.00</div>
                <div className="text-sm text-green-400">+8.2%</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Total Portfolio Value</span>
                <span className="text-xl font-bold text-white">$11,000.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">24h Change</span>
                <span className="text-lg font-semibold text-green-400">+$1,200.00 (+12.2%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
