export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">AlphaWhale Methodology</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
          <ul className="space-y-2 text-slate-300">
            <li>• <strong>Etherscan API:</strong> On-chain transaction data for Ethereum mainnet</li>
            <li>• <strong>CoinGecko API:</strong> Price data and market metrics</li>
            <li>• <strong>Internal Algorithms:</strong> Whale identification and behavior analysis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Update Cadence</h2>
          <ul className="space-y-2 text-slate-300">
            <li>• <strong>Whale Spotlight:</strong> Every 15 minutes</li>
            <li>• <strong>Fear & Whale Index:</strong> Every 30 minutes</li>
            <li>• <strong>Daily Digest:</strong> Every 6 hours</li>
            <li>• <strong>Price Data:</strong> Real-time (1-minute intervals)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulated Data Policy</h2>
          <p className="text-slate-300 mb-4">
            When live data sources are unavailable or rate-limited, AlphaWhale displays simulated data to demonstrate functionality. Simulated data is:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li>• Clearly marked with "Simulated" badges</li>
            <li>• Based on historical patterns and realistic scenarios</li>
            <li>• Updated regularly to maintain engagement</li>
            <li>• Replaced with live data when sources become available</li>
          </ul>
        </section>

        <section className="mb-8" id="fear-index">
          <h2 className="text-2xl font-semibold mb-4">Fear & Whale Index Formula</h2>
          <p className="text-slate-300 mb-4">
            The Fear & Whale Index is calculated on a 0-100 scale using:
          </p>
          <div className="bg-slate-800 p-4 rounded-lg mb-4">
            <code className="text-teal-400">
              Index = (Whale Activity × 0.4) + (Market Sentiment × 0.3) + (Volume Patterns × 0.3)
            </code>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Components:</h3>
          <ul className="space-y-2 text-slate-300 mb-4">
            <li>• <strong>Whale Activity:</strong> Large transaction frequency and size</li>
            <li>• <strong>Market Sentiment:</strong> Social signals and news sentiment</li>
            <li>• <strong>Volume Patterns:</strong> Unusual trading volume spikes</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Scale:</h3>
          <ul className="space-y-2 text-slate-300">
            <li>• <strong>0-25:</strong> Extreme Fear (Heavy selling pressure)</li>
            <li>• <strong>26-45:</strong> Fear (Selling bias)</li>
            <li>• <strong>46-55:</strong> Neutral (Balanced activity)</li>
            <li>• <strong>56-75:</strong> Greed (Accumulation bias)</li>
            <li>• <strong>76-100:</strong> Extreme Greed (Heavy buying pressure)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Confidence Score Inputs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">High Confidence</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Transaction amount > $1M USD</li>
                <li>• Wallet has >10 historical transactions</li>
                <li>• Multiple confirmation sources</li>
                <li>• Recent activity pattern</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Medium Confidence</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Transaction amount $100K - $1M USD</li>
                <li>• Wallet has 5-10 historical transactions</li>
                <li>• Single confirmation source</li>
                <li>• Moderate activity pattern</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Low Confidence</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Transaction amount < $100K USD</li>
                <li>• Wallet has <5 historical transactions</li>
                <li>• Unconfirmed or delayed data</li>
                <li>• Irregular activity pattern</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}