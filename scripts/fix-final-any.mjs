#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'src/components/analytics/PredictiveAnalytics.tsx',
  'src/components/debug/SubscriptionDebug.tsx',
  'src/components/debug/SubscriptionStatus.tsx',
  'src/components/debug/UserPlanDebug.tsx',
  'src/components/hub2/EntitySummaryCard.tsx',
  'src/components/hunter/OpportunityCardLegacy.tsx',
  'src/components/lite/DigestCard.tsx',
  'src/components/lite/SignalCards.tsx',
  'src/components/market-hub/WhaleClusters.tsx',
  'src/components/navigation/LiteGlobalHeader.tsx',
  'src/components/portfolio/ConcentrationRiskCard.tsx',
  'src/components/portfolio/LiquidityUnlockTracker.tsx',
  'src/components/portfolio/LiveChainDistribution.tsx',
  'src/components/portfolio/LiveWhaleActivity.tsx',
  'src/components/portfolio/PortfolioHeroCard.tsx',
  'src/components/portfolio/PortfolioTabs.tsx',
  'src/components/portfolio/ProductionStressTest.tsx',
  'src/components/portfolio/RiskIntelligenceCard.tsx',
  'src/components/portfolio/StressTest.tsx',
  'src/components/portfolio/WhaleInteractionLog.tsx',
  'src/components/shell/SearchCommand.tsx',
  'src/components/signals/CreateAlertModal.tsx',
  'src/components/signals/ExplainModal.tsx',
  'src/components/signals/PatternModal.tsx',
  'src/components/signals/SignalFeed.tsx',
  'src/components/yield/ProtocolDetailModal.tsx',
  'src/components/yield/YieldCalculator.tsx',
  'src/hooks/hub2.ts',
  'src/lib/aggregates.ts',
  'src/lib/api/etherscan.ts',
  'src/lib/cache/guardian.ts',
  'src/lib/market/data.ts',
  'src/pages/Home.tsx',
  'src/pages/Index.tsx',
  'src/pages/MarketDashboard.tsx',
  'src/pages/MultiCoinSentiment.tsx',
  'src/pages/PortfolioEnhanced.tsx',
  'src/pages/PortfolioIntelligence.tsx',
  'src/pages/Scanner.tsx',
  'src/pages/Yields.tsx',
  'src/pages/hub2/Alerts.tsx',
  'src/pages/hub2/Copilot.tsx',
  'src/pages/hub2/Explore.tsx',
  'src/services/PriceOracle_CoinGecko.ts',
  'src/services/coalesce.ts',
  'src/services/onboardingAnalytics.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return false;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Ultra-aggressive any replacement
  const replacements = [
    // Catch-all for any remaining any types
    [/\bany\b(?!\w)/g, (match, offset) => {
      // Don't replace in comments or strings
      const before = content.substring(Math.max(0, offset - 50), offset);
      if (before.includes('//') || before.includes('/*') || before.includes('"') || before.includes("'")) {
        return match;
      }
      return 'unknown';
    }],
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }
  return false;
}

console.log('🔧 Fixing final any types...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
