#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FEATURE_PATTERNS = {
  whaleSpotlight: [
    'whale.*spotlight',
    'spotlight.*whale',
    'whale.*movement',
    'whale.*activity'
  ],
  fearIndex: [
    'fear.*whale.*index',
    'whale.*fear.*index',
    'sentiment.*dial',
    'market.*sentiment'
  ],
  digest: [
    'daily.*digest',
    'whale.*digest',
    'digest.*card',
    'activity.*digest'
  ],
  watchlist: [
    'watchlist',
    'watch.*list',
    'monitored.*wallets'
  ],
  referrals: [
    'referral',
    'invite',
    'refer.*friend'
  ],
  shareCards: [
    'share.*card',
    'social.*share',
    'share.*button'
  ],
  exports: [
    'export.*csv',
    'export.*report',
    'download.*data'
  ],
  alerts: [
    'alert.*system',
    'notification',
    'custom.*alert'
  ],
  portfolioLite: [
    'portfolio.*lite',
    'basic.*portfolio',
    'wallet.*connect'
  ],
  proGating: [
    'upgrade.*pro',
    'pro.*gate',
    'tier.*gate',
    'feature.*gate'
  ]
};

function scanDirectory(dir, results = {}) {
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && !['node_modules', 'dist', 'build'].includes(item)) {
      scanDirectory(fullPath, results);
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(process.cwd(), fullPath);
        
        // Check for feature patterns
        for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(content) || regex.test(item)) {
              if (!results[feature]) results[feature] = [];
              results[feature].push({
                path: relativePath,
                type: getFileType(fullPath),
                matches: content.match(new RegExp(pattern, 'gi')) || []
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not read ${fullPath}: ${error.message}`);
      }
    }
  }
  
  return results;
}

function getFileType(filePath) {
  const fileName = path.basename(filePath);
  if (fileName.includes('component') || fileName.includes('Card') || fileName.includes('Modal')) return 'component';
  if (fileName.includes('hook') || fileName.startsWith('use')) return 'hook';
  if (fileName.includes('api') || fileName.includes('route')) return 'api';
  if (fileName.includes('page')) return 'page';
  if (fileName.includes('util') || fileName.includes('helper')) return 'util';
  return 'other';
}

function generateReuseMap(scanResults) {
  const reuseMap = [];
  
  for (const [feature, files] of Object.entries(scanResults)) {
    const status = files.length > 0 ? 'existing' : 'missing';
    const components = files.filter(f => f.type === 'component');
    const hooks = files.filter(f => f.type === 'hook');
    const apis = files.filter(f => f.type === 'api');
    
    reuseMap.push({
      feature,
      status,
      components: components.map(c => c.path),
      hooks: hooks.map(h => h.path),
      apis: apis.map(a => a.path),
      needsAdapter: files.length > 0 && files.some(f => f.path.includes('legacy'))
    });
  }
  
  return reuseMap;
}

function generateMarkdownReport(reuseMap) {
  let markdown = `# Feature Reuse Map\n\nGenerated: ${new Date().toISOString()}\n\n`;
  
  markdown += `| Feature | Status | Components | Hooks | APIs | Needs Adapter | Notes |\n`;
  markdown += `|---------|--------|------------|-------|------|---------------|-------|\n`;
  
  for (const item of reuseMap) {
    const components = item.components.length > 0 ? item.components.join(', ') : 'None';
    const hooks = item.hooks.length > 0 ? item.hooks.join(', ') : 'None';
    const apis = item.apis.length > 0 ? item.apis.join(', ') : 'None';
    const needsAdapter = item.needsAdapter ? 'Yes' : 'No';
    const notes = item.status === 'existing' ? 'Ready to reuse' : 'Needs implementation';
    
    markdown += `| ${item.feature} | ${item.status} | ${components} | ${hooks} | ${apis} | ${needsAdapter} | ${notes} |\n`;
  }
  
  return markdown;
}

// Main execution
console.log('🔍 Scanning for existing features...');

const scanResults = {};
const dirsToScan = [
  'src/components',
  'src/hooks', 
  'src/app',
  'src/pages',
  'apps/web/src',
  'apps/legacy/src'
];

for (const dir of dirsToScan) {
  console.log(`Scanning ${dir}...`);
  scanDirectory(dir, scanResults);
}

const reuseMap = generateReuseMap(scanResults);
const markdownReport = generateMarkdownReport(reuseMap);

// Ensure docs directory exists
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs');
}

// Write reuse map
fs.writeFileSync('docs/reuse-map.md', markdownReport);

// Write JSON for programmatic access
fs.writeFileSync('docs/reuse-map.json', JSON.stringify(reuseMap, null, 2));

console.log('✅ Feature audit complete!');
console.log(`📊 Found features: ${Object.keys(scanResults).length}`);
console.log(`📝 Report saved to docs/reuse-map.md`);

// Print summary
console.log('\n📋 Summary:');
for (const item of reuseMap) {
  const icon = item.status === 'existing' ? '✅' : '❌';
  console.log(`${icon} ${item.feature}: ${item.status} (${item.components.length + item.hooks.length + item.apis.length} files)`);
}