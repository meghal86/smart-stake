import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ArrowLeft, Brain, Wrench } from 'lucide-react';
import { FooterNav } from '@/components/layout/FooterNav';

export function GuardianLearn() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] to-[#111827] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[rgba(16,18,30,0.75)] border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#00C9A7]" />
            <div>
              <h1 className="text-xl font-semibold">Guardian Learn</h1>
              <p className="text-xs text-gray-400">Understanding wallet security</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 py-6 pb-32 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-[#00C9A7] font-medium mb-2 tracking-wide uppercase">
            Your AI-powered safety guide for DeFi
          </p>
          <h2 className="text-3xl font-bold mb-4 text-white">
            🛡️ How Guardian Protects Your Wallet
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Guardian analyzes your wallet for security risks and provides actionable insights to keep your funds safe.
          </p>
        </motion.div>

        {/* Trust Score Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-[rgba(20,22,40,0.8)] rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-[#00C9A7]" />
              <h3 className="text-xl font-semibold">Trust Score Explained</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-[#00C9A7]">What it measures:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Token approvals and unlimited permissions</li>
                  <li>• Mixer and privacy protocol interactions</li>
                  <li>• Contract reputation and age</li>
                  <li>• Transaction patterns and behavior</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-[#00C9A7]">Score ranges:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs rounded-full px-2 py-1 font-medium">🟢 90-100</span>
                    <span className="text-sm">Excellent (Very Safe)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-green-500/20 text-green-400 text-xs rounded-full px-2 py-1 font-medium">🟩 80-89</span>
                    <span className="text-sm">Good (Safe)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs rounded-full px-2 py-1 font-medium">🟨 60-79</span>
                    <span className="text-sm">Fair (Some Risk)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-1 font-medium">🔴 0-59</span>
                    <span className="text-sm">Poor (High Risk)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How Trust Score Changes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <div className="bg-[rgba(20,22,40,0.8)] rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h3 className="text-xl font-semibold mb-4 text-[#00C9A7]">How Trust Score Changes</h3>
            <div className="text-gray-300 leading-relaxed">
              <p className="mb-3">
                Your Trust Score updates every time you scan or interact with new contracts.
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Fixing risks raises your score immediately</li>
                <li>Risky activity or new approvals may lower it</li>
                <li>Guardian learns from every scan to improve accuracy</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Risk Types */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-semibold mb-6 text-center">Common Risk Types</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[rgba(20,22,40,0.8)] rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
              <AlertTriangle className="w-8 h-8 text-[#7B61FF] mb-4" />
              <h4 className="font-semibold mb-2">Active Risks</h4>
              <p className="text-sm text-gray-300 mb-3">
                Security issues that need immediate attention, like unlimited approvals to risky contracts.
              </p>
              <span className="inline-block bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-0.5 font-medium">
                High Impact
              </span>
            </div>

            <div className="bg-[rgba(20,22,40,0.8)] rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
              <Shield className="w-8 h-8 text-blue-400 mb-4" />
              <h4 className="font-semibold mb-2">Token Approvals</h4>
              <p className="text-sm text-gray-300 mb-3">
                Permissions you've granted to DeFi protocols. Old or unlimited approvals can be risky.
              </p>
              <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs rounded-full px-2 py-0.5 font-medium">
                Medium Impact
              </span>
            </div>

            <div className="bg-[rgba(20,22,40,0.8)] rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
              <CheckCircle className="w-8 h-8 text-[#00C9A7] mb-4" />
              <h4 className="font-semibold mb-2">Mixer Exposure</h4>
              <p className="text-sm text-gray-300 mb-3">
                Interactions with privacy mixers. While not illegal, they can flag your wallet as high-risk.
              </p>
              <span className="inline-block bg-green-500/20 text-green-400 text-xs rounded-full px-2 py-0.5 font-medium">
                Low Impact
              </span>
            </div>
          </div>
        </motion.section>

        {/* Best Practices */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="bg-[rgba(20,22,40,0.8)] rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="w-6 h-6 text-[#00C9A7]" />
              <h3 className="text-xl font-semibold">Security Best Practices</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-[#00C9A7]">Regular Maintenance:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Scan your wallet monthly with Guardian</li>
                  <li>• Revoke unused token approvals</li>
                  <li>• Monitor for new risks and alerts</li>
                  <li>• Keep track of connected dApps</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-[#00C9A7]">Safe Practices:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Only approve what you need</li>
                  <li>• Use separate wallets for different purposes</li>
                  <li>• Research protocols before connecting</li>
                  <li>• Enable hardware wallet protection</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <h4 className="font-medium mb-2 text-[#00C9A7]">Is Guardian safe to use?</h4>
              <p className="text-sm text-gray-300">
                Yes. Guardian only reads your wallet data and never requests private keys or signing permissions. 
                All scans are read-only and cannot move your funds.
              </p>
            </div>
            <div className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <h4 className="font-medium mb-2 text-[#00C9A7]">How often should I scan?</h4>
              <p className="text-sm text-gray-300">
                We recommend scanning monthly or after interacting with new DeFi protocols. 
                Guardian automatically rescans every 24 hours for Pro users.
              </p>
            </div>
            <div className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <h4 className="font-medium mb-2 text-[#00C9A7]">What if I have a low Trust Score?</h4>
              <p className="text-sm text-gray-300">
                Don't panic. Use the "Fix Risks" feature to revoke unnecessary approvals and follow 
                the recommendations. Most issues can be resolved quickly.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Back to Guardian */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-8 border-t border-gray-700/40"
        >
          <button 
            onClick={() => window.location.href = '/guardian'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20 transition"
          >
            <Shield className="w-4 h-4" />
            Back to Guardian Dashboard
          </button>
        </motion.div>
      </main>

      <FooterNav />
    </div>
  );
}

export default GuardianLearn;