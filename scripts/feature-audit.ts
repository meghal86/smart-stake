#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';

interface FeatureResult {
  key: string;
  feature: string;
  tier?: string;
  flag?: string;
  status: 'Built' | 'Partial' | 'Missing' | 'Flagged-Off';
  evidence: string[];
  tests: {
    unit: boolean;
    e2e: boolean;
    a11y: boolean;
    perf: boolean;
  };
  mustHave: boolean;
}

interface DetectionRule {
  key: string;
  feature: string;
  tier?: string;
  flag?: string;
  mustHave: boolean;
  globs: string[];
  symbols?: string[];
  routes?: string[];
  flags?: string[];
  content?: string[];
}

const DETECTION_MAP: DetectionRule[] = [
  // A. Pixel & UX polish
  {
    key: 'layout_rhythm_tokens',
    feature: 'Spacing tokens s4/8/12/16/24; normalized paddings',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/tokens.css', '**/styles/**'],
    content: ['--s4', '--s8', '--s16', 'section-header']
  },
  {
    key: 'cta_hierarchy',
    feature: 'Primary Set Alert, secondary Follow, tertiary Share styles',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/components/**'],
    content: ['btn-primary', 'Set Alert', 'Follow', 'Share']
  },
  {
    key: 'foryou_carousel_newdot',
    feature: 'For You row as horizontal carousel with New indicator',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/ForYouRow.*', '**/components/**'],
    symbols: ['ForYouRow'],
    content: ['For You', 'carousel', 'New']
  },
  {
    key: 'digest_row_clickable_hotkeys',
    feature: 'Digest rows clickable with mini CTAs and keyboard shortcuts',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/components/**'],
    content: ['digest', 'clickable', 'hover', 'keyboard']
  },
  {
    key: 'spotlight_time_confidence',
    feature: 'Spotlight: absolute+relative time + confidence chip',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/ConfidenceChip.*', '**/components/**'],
    symbols: ['ConfidenceChip'],
    content: ['UTC', 'confidence', 'Last updated']
  },
  {
    key: 'fear_index_marker_methodology',
    feature: 'Fear Index score on marker + Methodology link',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/methodology.*', 'docs/methodology.*'],
    content: ['methodology', 'Fear', 'Index']
  },
  {
    key: 'alerts_filters_markread',
    feature: 'Alerts Feed tabs All/Mine/System + Mark all read',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/AlertsFeed.*'],
    symbols: ['AlertsFeed'],
    content: ['All', 'Mine', 'System', 'Mark all read']
  },
  {
    key: 'portfolio_demo_reset',
    feature: 'Try Demo Portfolio + 24h P&L + Reset demo',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/components/**'],
    content: ['Try Demo', 'Demo Portfolio', 'Reset']
  },
  {
    key: 'pro_teaser_price_trust',
    feature: '$19/mo, bullets, Cancel anytime, trust indicators',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/ProTeaser.*'],
    symbols: ['ProTeaser'],
    content: ['$19', 'Cancel anytime', 'No keys']
  },
  {
    key: 'mobile_sticky_subheaders_safearea',
    feature: 'Mobile sticky headers and safe-area padding',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/MobileDock.*', '**/components/**'],
    content: ['safe-area', 'sticky', 'mobile']
  },
  {
    key: 'accessibility_core',
    feature: 'Focus order, aria-live, gradient AA contrast',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/components/**'],
    content: ['aria-live', 'focus', 'accessibility']
  },
  {
    key: 'microcopy_tone_update',
    feature: 'See full analysis copy + Simulated tooltip',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/components/**'],
    content: ['See full analysis', 'Simulated']
  },

  // B. Stickiness & viral
  {
    key: 'foryou_row_actions',
    feature: 'For You quick actions (Set Alert/Follow/Share)',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/ForYouRow.*'],
    symbols: ['ForYouRow'],
    content: ['Set Alert', 'Follow', 'Share']
  },
  {
    key: 'alerts_feed',
    feature: 'Alerts list grouped by time with create modal',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/AlertsFeed.*'],
    symbols: ['AlertsFeed'],
    content: ['Create Alert', 'Last hour', 'Today']
  },
  {
    key: 'actionable_digest_ctas',
    feature: 'CTAs on each digest line',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/components/**'],
    content: ['digest', 'CTA', 'Set Alert']
  },
  {
    key: 'trust_anchors_global',
    feature: 'Etherscan links, Last-updated, Provenance tooltips',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/components/**'],
    content: ['Etherscan', 'Last updated', 'Provenance']
  },
  {
    key: 'pro_teaser_trial',
    feature: '7-day trial CTA',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/ProTeaser.*'],
    content: ['7-day trial', 'trial']
  },
  {
    key: 'mobile_sticky_dock',
    feature: 'Mobile dock: Spotlight|Watchlist|Alerts|Upgrade',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/MobileDock.*'],
    symbols: ['MobileDock'],
    content: ['Spotlight', 'Watchlist', 'Alerts', 'Upgrade']
  },
  {
    key: 'demo_portfolio_btn',
    feature: 'Demo portfolio button near Connect Wallet',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/components/**'],
    content: ['Try Demo', 'Connect Wallet']
  },
  {
    key: 'telemetry_events_core',
    feature: 'Core telemetry events tracked',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/telemetry/**', '**/useTelemetry.*', '**/api/telemetry/**'],
    symbols: ['useTelemetry'],
    content: ['follow_whale', 'create_alert_open', 'upgrade_click']
  },
  {
    key: 'share_og_cards',
    feature: 'OG image endpoint + share copy',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/api/og/**', '**/api/share/**'],
    routes: ['/api/og', '/api/share']
  },
  {
    key: 'referrals_flow',
    feature: 'Invite + progress tracking',
    tier: 'pro',
    mustHave: false,
    globs: ['**/referrals/**'],
    routes: ['/referrals']
  },

  // C. Onboarding + Sync + Feedback
  {
    key: 'nux_wizard_three_steps',
    feature: 'Onboarding: pick assets → follow whales → enable alerts',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/OnboardingWizard.*'],
    symbols: ['OnboardingWizard'],
    content: ['Make it yours', 'Track the smart money', 'Never miss']
  },
  {
    key: 'visual_feedback_refresh',
    feature: 'Refresh spinner, skeletons, auto-refresh pulse',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/RefreshButton.*', '**/components/**'],
    symbols: ['RefreshButton'],
    content: ['spinner', 'skeleton', 'refresh']
  },
  {
    key: 'cloud_sync_cross_device',
    feature: 'Cross-device sync with user_id or anon_id',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/useCloudSync.*', '**/hooks/**'],
    symbols: ['useCloudSync'],
    content: ['sync', 'user_id', 'anon_id']
  },
  {
    key: 'link_to_email_or_share_code',
    feature: 'Email linking or share code import flow',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/hooks/**', '**/components/**'],
    content: ['link to email', 'share code']
  },
  {
    key: 'push_notifications_webpush',
    feature: 'Service worker + VAPID push notifications',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['public/sw.js', '**/push/**', '**/api/push/**'],
    content: ['VAPID', 'service worker', 'push']
  },
  {
    key: 'funnel_dashboard_internal',
    feature: 'Internal funnel dashboard page',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/internal/funnel/**'],
    routes: ['/internal/funnel']
  },
  {
    key: 'methodology_docs',
    feature: 'Methodology documentation page',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['docs/methodology.*', '**/docs/methodology/**'],
    routes: ['/docs/methodology']
  },

  // D. Leaderboards & Community
  {
    key: 'leaderboards_page',
    feature: 'Most Followed Whales & Top Demo Portfolios',
    tier: 'pro',
    mustHave: false,
    globs: ['**/leaderboards/**'],
    routes: ['/leaderboards']
  },
  {
    key: 'community_threads',
    feature: 'Realtime community threads per wallet',
    tier: 'pro',
    mustHave: false,
    globs: ['**/community/**'],
    routes: ['/community']
  },

  // E. Quality & CI
  {
    key: 'tests_unit_key_paths',
    feature: 'Unit tests for key components and hooks',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/__tests__/**', '**/tests/**', '**/*.test.*'],
    content: ['test', 'describe', 'it']
  },
  {
    key: 'tests_integration_msq',
    feature: 'MSW integration tests',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/tests/**'],
    content: ['MSW', 'integration']
  },
  {
    key: 'tests_e2e_core',
    feature: 'E2E tests for core user flows',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/e2e/**', '**/playwright/**'],
    content: ['playwright', 'e2e']
  },
  {
    key: 'tests_a11y_axe',
    feature: 'Accessibility tests with axe-core',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/tests/**', '**/e2e/**'],
    content: ['axe', 'accessibility']
  },
  {
    key: 'tests_perf_k6',
    feature: 'Performance tests with k6',
    tier: 'ui.v2',
    mustHave: false,
    globs: ['**/perf/**', '**/k6/**'],
    content: ['k6', 'performance']
  },
  {
    key: 'ci_audit_gate',
    feature: 'CI workflow running feature audit',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['.github/workflows/**'],
    content: ['audit', 'feature']
  },
  {
    key: 'flags_registry',
    feature: 'Feature flags defined and documented',
    tier: 'ui.v2',
    mustHave: true,
    globs: ['**/config/flags.*', '**/config/gating.*'],
    content: ['flags', 'ui.v2', 'onboarding']
  }
];

async function auditFeature(rule: DetectionRule): Promise<FeatureResult> {
  const evidence: string[] = [];
  let hasFiles = false;
  let hasContent = false;
  let hasSymbols = false;

  // Check file globs
  for (const pattern of rule.globs) {
    const files = await glob(pattern, { cwd: process.cwd() });
    if (files.length > 0) {
      hasFiles = true;
      evidence.push(...files.slice(0, 2));
    }
  }

  // Check content in files
  if (rule.content && hasFiles) {
    for (const pattern of rule.globs) {
      const files = await glob(pattern, { cwd: process.cwd() });
      for (const file of files.slice(0, 3)) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const foundContent = rule.content.some(term => 
            content.toLowerCase().includes(term.toLowerCase())
          );
          if (foundContent) {
            hasContent = true;
            break;
          }
        } catch (e) {
          // File might not exist or be readable
        }
      }
    }
  }

  // Check symbols (simplified - just check if exported)
  if (rule.symbols && hasFiles) {
    for (const symbol of rule.symbols) {
      for (const pattern of rule.globs) {
        const files = await glob(pattern, { cwd: process.cwd() });
        for (const file of files) {
          try {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes(`export`) && content.includes(symbol)) {
              hasSymbols = true;
              break;
            }
          } catch (e) {
            // Continue
          }
        }
      }
    }
  }

  // Check routes
  if (rule.routes) {
    for (const route of rule.routes) {
      const routeFiles = await glob(`**${route}/**/page.*`, { cwd: process.cwd() });
      if (routeFiles.length > 0) {
        hasFiles = true;
        evidence.push(...routeFiles.slice(0, 1));
      }
    }
  }

  // Check tests
  const testGlobs = [
    `**/__tests__/**/*${rule.key}*`,
    `**/tests/**/*${rule.key}*`,
    `**/*.test.*`
  ];
  
  const tests = {
    unit: false,
    e2e: false,
    a11y: false,
    perf: false
  };

  for (const pattern of testGlobs) {
    const testFiles = await glob(pattern, { cwd: process.cwd() });
    if (testFiles.length > 0) {
      tests.unit = true;
      if (testFiles.some(f => f.includes('e2e'))) tests.e2e = true;
      if (testFiles.some(f => f.includes('a11y'))) tests.a11y = true;
      if (testFiles.some(f => f.includes('perf'))) tests.perf = true;
    }
  }

  // Determine status
  let status: FeatureResult['status'] = 'Missing';
  
  if (hasFiles && (hasContent || hasSymbols || !rule.content)) {
    status = 'Built';
  } else if (hasFiles) {
    status = 'Partial';
  }

  // Check if flagged off
  if (status === 'Built' && rule.flag) {
    try {
      const flagFiles = await glob('**/config/flags.*', { cwd: process.cwd() });
      for (const flagFile of flagFiles) {
        const content = fs.readFileSync(flagFile, 'utf-8');
        if (content.includes(rule.flag) && content.includes('false')) {
          status = 'Flagged-Off';
          break;
        }
      }
    } catch (e) {
      // Continue
    }
  }

  return {
    key: rule.key,
    feature: rule.feature,
    tier: rule.tier,
    flag: rule.flag,
    status,
    evidence: evidence.slice(0, 3),
    tests,
    mustHave: rule.mustHave
  };
}

async function runAudit(): Promise<FeatureResult[]> {
  const results: FeatureResult[] = [];
  
  for (const rule of DETECTION_MAP) {
    const result = await auditFeature(rule);
    results.push(result);
  }
  
  return results;
}

function generateMarkdown(results: FeatureResult[]): string {
  const statusEmoji = {
    'Built': '✅',
    'Partial': '🟡',
    'Missing': '❌',
    'Flagged-Off': '🚩'
  };

  let md = '# AlphaWhale Lite Feature Audit\n\n';
  
  // Summary
  const summary = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  md += '## Summary\n\n';
  Object.entries(summary).forEach(([status, count]) => {
    md += `- ${statusEmoji[status as keyof typeof statusEmoji]} **${status}**: ${count}\n`;
  });
  
  // Missing Must-Haves
  const missingMustHaves = results.filter(r => r.mustHave && r.status === 'Missing');
  if (missingMustHaves.length > 0) {
    md += '\n## ⚠️ Missing Must-Haves\n\n';
    missingMustHaves.forEach(r => {
      md += `- ${r.key}: ${r.feature}\n`;
    });
  }
  
  // Full table
  md += '\n## Feature Details\n\n';
  md += '| Key | Feature | Tier/Flag | Status | Evidence | Tests |\n';
  md += '|-----|---------|-----------|--------|----------|-------|\n';
  
  results.forEach(r => {
    const testStr = Object.entries(r.tests)
      .filter(([_, v]) => v)
      .map(([k, _]) => k)
      .join(':') || 'none';
    
    md += `| ${r.key} | ${r.feature} | ${r.tier || ''} | ${statusEmoji[r.status]} ${r.status} | ${r.evidence.join(', ') || 'none'} | ${testStr} |\n`;
  });
  
  return md;
}

async function main() {
  console.log('🔍 Running AlphaWhale Lite feature audit...');
  
  const results = await runAudit();
  
  // Generate outputs
  const markdown = generateMarkdown(results);
  const json = JSON.stringify(results, null, 2);
  
  // Write files
  fs.writeFileSync('docs/feature-audit.md', markdown);
  fs.writeFileSync('docs/feature-audit.json', json);
  
  console.log('📊 Audit complete!');
  console.log(`- Built: ${results.filter(r => r.status === 'Built').length}`);
  console.log(`- Partial: ${results.filter(r => r.status === 'Partial').length}`);
  console.log(`- Missing: ${results.filter(r => r.status === 'Missing').length}`);
  console.log(`- Flagged-Off: ${results.filter(r => r.status === 'Flagged-Off').length}`);
  
  const missingMustHaves = results.filter(r => r.mustHave && r.status === 'Missing');
  if (missingMustHaves.length > 0) {
    console.error(`❌ ${missingMustHaves.length} missing must-have features!`);
    process.exit(1);
  }
  
  console.log('✅ All must-have features present');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runAudit, generateMarkdown, DETECTION_MAP };