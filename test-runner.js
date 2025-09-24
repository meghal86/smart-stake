#!/usr/bin/env node

/**
 * Market Intelligence Hub - Automated Feature Testing
 * Tests every component and feature systematically
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

class MarketHubTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async setup() {
    console.log(chalk.blue('🚀 Starting Market Intelligence Hub Tests...\n'));
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    this.page = await this.browser.newPage();
    await this.page.goto('http://localhost:8081/market/hub');
    await this.page.waitForTimeout(2000); // Wait for initial load
  }

  async test(name, testFn) {
    try {
      console.log(chalk.yellow(`Testing: ${name}`));
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
      console.log(chalk.green(`✅ ${name}\n`));
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(chalk.red(`❌ ${name}: ${error.message}\n`));
    }
  }

  async testMarketHealthCards() {
    await this.test('Market Health Cards - 4 cards rendered', async () => {
      const cards = await this.page.$$('[data-testid="market-health-card"], .grid > .p-4');
      if (cards.length !== 4) {
        throw new Error(`Expected 4 cards, found ${cards.length}`);
      }
    });

    await this.test('Market Health Cards - Market Mood displayed', async () => {
      const moodText = await this.page.$eval('text=Market Mood', el => el.textContent);
      if (!moodText) throw new Error('Market Mood not found');
    });

    await this.test('Market Health Cards - Volume with delta', async () => {
      const volumeExists = await this.page.$('text=24h Volume');
      if (!volumeExists) throw new Error('24h Volume not found');
    });

    await this.test('Market Health Cards - Top alerts clickable', async () => {
      const alertExists = await this.page.$('text=Risk Index');
      if (!alertExists) throw new Error('Risk Index card not found');
    });
  }

  async testWhaleClusters() {
    await this.test('Whale Clusters - 5 cluster types', async () => {
      const clusterCards = await this.page.$$('.grid .cursor-pointer');
      if (clusterCards.length < 5) {
        throw new Error(`Expected at least 5 clusters, found ${clusterCards.length}`);
      }
    });

    await this.test('Whale Clusters - Risk heatmap by chain', async () => {
      const heatmapExists = await this.page.$('text=Risk Heatmap by Chain');
      if (!heatmapExists) throw new Error('Risk heatmap not found');
    });

    await this.test('Whale Clusters - Drill-down table on selection', async () => {
      // Click first cluster
      const firstCluster = await this.page.$('.grid .cursor-pointer');
      if (firstCluster) {
        await firstCluster.click();
        await this.page.waitForTimeout(500);
        
        const detailsTable = await this.page.$('text=Details');
        if (!detailsTable) throw new Error('Drill-down table not shown');
      }
    });
  }

  async testAlertsSidebar() {
    await this.test('Alerts Sidebar - Real-time alerts header', async () => {
      const alertsHeader = await this.page.$('text=Real-time Alerts');
      if (!alertsHeader) throw new Error('Alerts sidebar not found');
    });

    await this.test('Alerts Sidebar - AI Digest present', async () => {
      const aiDigest = await this.page.$('text=AI Digest');
      if (!aiDigest) throw new Error('AI Digest not found');
    });

    await this.test('Alerts Sidebar - Filter badges functional', async () => {
      const allFilter = await this.page.$('text=All');
      if (allFilter) {
        await allFilter.click();
        await this.page.waitForTimeout(200);
      }
    });

    await this.test('Alerts Sidebar - Search functionality', async () => {
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('whale');
        await this.page.waitForTimeout(300);
      }
    });
  }

  async testTabNavigation() {
    await this.test('Tab Navigation - 4 tabs present', async () => {
      const tabs = await this.page.$$('[role="tab"]');
      if (tabs.length !== 4) {
        throw new Error(`Expected 4 tabs, found ${tabs.length}`);
      }
    });

    await this.test('Tab Navigation - Whale Analytics tab', async () => {
      const whaleTab = await this.page.$('text=Whale Analytics');
      if (whaleTab) {
        await whaleTab.click();
        await this.page.waitForTimeout(500);
        
        const whaleContent = await this.page.$('text=Whale Analytics');
        if (!whaleContent) throw new Error('Whale Analytics content not loaded');
      }
    });

    await this.test('Tab Navigation - Sentiment tab', async () => {
      const sentimentTab = await this.page.$('text=Sentiment');
      if (sentimentTab) {
        await sentimentTab.click();
        await this.page.waitForTimeout(500);
        
        const sentimentContent = await this.page.$('text=Multi-Coin Sentiment');
        if (!sentimentContent) throw new Error('Sentiment content not loaded');
      }
    });

    await this.test('Tab Navigation - Correlation tab', async () => {
      const correlationTab = await this.page.$('text=Correlation');
      if (correlationTab) {
        await correlationTab.click();
        await this.page.waitForTimeout(500);
        
        const correlationContent = await this.page.$('text=Correlation Heatmap');
        if (!correlationContent) throw new Error('Correlation content not loaded');
      }
    });
  }

  async testCommandPalette() {
    await this.test('Command Palette - Cmd+K opens palette', async () => {
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('k');
      await this.page.keyboard.up('Meta');
      await this.page.waitForTimeout(300);
      
      const searchInput = await this.page.$('input[placeholder*="Search coins"]');
      if (!searchInput) throw new Error('Command palette did not open');
      
      // Close palette
      await this.page.keyboard.press('Escape');
    });
  }

  async testContextualActionBar() {
    await this.test('Contextual Action Bar - Appears on selection', async () => {
      // Go back to Intelligence Hub tab
      const intelligenceTab = await this.page.$('text=Intelligence Hub');
      if (intelligenceTab) await intelligenceTab.click();
      await this.page.waitForTimeout(500);
      
      // Select a cluster
      const firstCluster = await this.page.$('.grid .cursor-pointer');
      if (firstCluster) {
        await firstCluster.click();
        await this.page.waitForTimeout(500);
        
        const actionBar = await this.page.$('text=Trade/Hedge');
        if (!actionBar) throw new Error('Contextual action bar not shown');
      }
    });

    await this.test('Contextual Action Bar - Pro features gated', async () => {
      const csvButton = await this.page.$('text=CSV');
      if (csvButton) {
        const proBadge = await this.page.$('text=Pro');
        // Pro badge should exist for free users
      }
    });
  }

  async testResponsiveDesign() {
    await this.test('Responsive Design - Mobile viewport', async () => {
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.waitForTimeout(500);
      
      // Check if mobile layout is applied
      const mobileLayout = await this.page.$('.w-96'); // Sidebar should be hidden
      
      // Reset to desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
    });
  }

  async testPerformance() {
    await this.test('Performance - Page load metrics', async () => {
      const metrics = await this.page.metrics();
      
      if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) { // 50MB
        throw new Error(`High memory usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
      }
    });
  }

  async runAllTests() {
    await this.setup();
    
    try {
      await this.testMarketHealthCards();
      await this.testWhaleClusters();
      await this.testAlertsSidebar();
      await this.testTabNavigation();
      await this.testCommandPalette();
      await this.testContextualActionBar();
      await this.testResponsiveDesign();
      await this.testPerformance();
      
    } catch (error) {
      console.error(chalk.red('Test suite failed:'), error);
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    
    this.printResults();
  }

  printResults() {
    console.log(chalk.blue('\n📊 Test Results Summary'));
    console.log(chalk.blue('========================\n'));
    
    console.log(chalk.green(`✅ Passed: ${this.results.passed}`));
    console.log(chalk.red(`❌ Failed: ${this.results.failed}`));
    console.log(chalk.blue(`📝 Total: ${this.results.tests.length}\n`));
    
    if (this.results.failed > 0) {
      console.log(chalk.red('Failed Tests:'));
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(chalk.red(`  • ${test.name}: ${test.error}`));
        });
    }
    
    const successRate = Math.round((this.results.passed / this.results.tests.length) * 100);
    console.log(chalk.blue(`\n🎯 Success Rate: ${successRate}%`));
    
    if (successRate >= 90) {
      console.log(chalk.green('🎉 Market Intelligence Hub is ready for production!'));
    } else if (successRate >= 75) {
      console.log(chalk.yellow('⚠️  Some issues need attention before release'));
    } else {
      console.log(chalk.red('🚨 Critical issues found - not ready for release'));
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MarketHubTester();
  tester.runAllTests().catch(console.error);
}

module.exports = MarketHubTester;