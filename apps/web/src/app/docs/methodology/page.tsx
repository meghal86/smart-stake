export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">AlphaWhale Methodology</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
          <ul className="space-y-2 text-slate-300">
            <li>• Etherscan API: On-chain transaction data for Ethereum mainnet</li>
            <li>• CoinGecko API: Price data and market metrics</li>
            <li>• Internal Algorithms: Whale identification and behavior analysis</li>
          </ul>
        </section>

        <section className="mb-8" id="fear-index">
          <h2 className="text-2xl font-semibold mb-4">Fear & Whale Index Formula</h2>
          <p className="text-slate-300 mb-4">
            The Fear & Whale Index is calculated on a 0-100 scale using whale activity, market sentiment, and volume patterns.
          </p>
          
          <h3 className="text-xl font-semibold mb-2">Scale:</h3>
          <ul className="space-y-2 text-slate-300">
            <li>• 0-25: Extreme Fear</li>
            <li>• 26-45: Fear</li>
            <li>• 46-55: Neutral</li>
            <li>• 56-75: Greed</li>
            <li>• 76-100: Extreme Greed</li>
          </ul>
        </section>
      </div>
    </div>
  );
}