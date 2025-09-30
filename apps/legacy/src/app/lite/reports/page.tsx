'use client'

import { useState } from 'react'

export default function LiteReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setReportGenerated(true)
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">📋 Reports</h1>
        <p className="text-slate-400 mt-2">
          Generate whale intelligence reports
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 shadow">
        <h2 className="text-xl font-semibold text-white mb-4">Report Generation</h2>
        
        {!reportGenerated ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-400">Generate your first whale intelligence report</p>
            <button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="mt-4 rounded-xl bg-teal-600 px-6 py-3 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 font-semibold">Report Generated Successfully</span>
              </div>
              <p className="text-slate-300 text-sm">Your whale intelligence report is ready for download</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-800 rounded-lg">
                <h3 className="font-semibold text-white mb-2">📈 Market Summary</h3>
                <p className="text-slate-300 text-sm">
                  Whale activity increased by 23% this week, with major movements detected in ETH and BTC markets.
                </p>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <h3 className="font-semibold text-white mb-2">🐋 Top Whale Movements</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• 10,000 ETH moved to Binance (High Impact)</li>
                  <li>• 2,500 BTC withdrawn from Coinbase (Medium Impact)</li>
                  <li>• 50M USDT minted on Tron (Low Impact)</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <h3 className="font-semibold text-white mb-2">⚠️ Risk Alerts</h3>
                <p className="text-slate-300 text-sm">
                  Elevated whale activity detected in DeFi tokens. Monitor for potential market volatility.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 rounded-xl bg-teal-600 px-4 py-3 text-white font-semibold hover:bg-teal-700 transition-colors">
                Download PDF
              </button>
              <button 
                onClick={() => setReportGenerated(false)}
                className="flex-1 rounded-xl bg-slate-700 px-4 py-3 text-white font-semibold hover:bg-slate-600 transition-colors"
              >
                Generate New Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
